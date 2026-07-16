---
read_when:
    - आप Feishu/Lark बॉट कनेक्ट करना चाहते हैं
    - आप Feishu चैनल कॉन्फ़िगर कर रहे हैं
summary: Feishu बॉट का अवलोकन, सुविधाएँ और कॉन्फ़िगरेशन
title: Feishu
x-i18n:
    generated_at: "2026-07-16T13:15:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 007f3db63fe70b9e7f0267043e47555af7dd55e73c8fd78156b1c9190360b858
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw आधिकारिक `@openclaw/feishu` Plugin के माध्यम से Feishu/Lark (ऑल-इन-वन सहयोग प्लेटफ़ॉर्म) से जुड़ता है: बॉट DM, समूह चैट, स्ट्रीमिंग कार्ड उत्तर और Feishu दस्तावेज़/wiki/drive/Bitable टूल।

**स्थिति:** बॉट DM + समूह चैट के लिए उत्पादन हेतु तैयार। WebSocket डिफ़ॉल्ट इवेंट ट्रांसपोर्ट है (किसी सार्वजनिक URL की आवश्यकता नहीं); webhook मोड वैकल्पिक है।

## त्वरित शुरुआत

<Note>
OpenClaw 2026.5.29 या उसके बाद का संस्करण आवश्यक है। जाँचने के लिए `openclaw --version` चलाएँ। `openclaw update` से अपग्रेड करें।
</Note>

<Steps>
  <Step title="चैनल सेटअप विज़ार्ड चलाएँ">
  ```bash
  openclaw channels login --channel feishu
  ```
  यदि `@openclaw/feishu` Plugin मौजूद नहीं है, तो यह उसे इंस्टॉल करता है और फिर सेटअप की प्रक्रिया पूरी कराता है:

- **मैन्युअल सेटअप**: Feishu Open Platform (`https://open.feishu.cn`) या Lark Developer (`https://open.larksuite.com`) से App ID और App Secret पेस्ट करें।
- **QR सेटअप**: स्वचालित रूप से बॉट बनाने के लिए Feishu ऐप में QR कोड स्कैन करें। यह प्रवाह DM को केवल आपके अपने खाते तक सीमित कर देता है (आपके `open_id` के साथ `dmPolicy: "allowlist"`)।

विज़ार्ड API डोमेन (Feishu या Lark) और समूह नीति भी पूछता है। यदि घरेलू Feishu मोबाइल ऐप QR कोड पर प्रतिक्रिया नहीं करता, तो सेटअप दोबारा चलाएँ और मैन्युअल सेटअप चुनें।
</Step>

  <Step title="सेटअप पूरा होने के बाद, बदलाव लागू करने के लिए Gateway पुनः आरंभ करें">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## अभिगम नियंत्रण

### सीधे संदेश

यह नियंत्रित करने के लिए कि बॉट को कौन DM कर सकता है, `channels.feishu.dmPolicy` (डिफ़ॉल्ट: `pairing`) कॉन्फ़िगर करें:

| मान         | व्यवहार                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | अज्ञात उपयोगकर्ताओं को पेयरिंग कोड मिलता है; CLI के माध्यम से स्वीकृत करें                                                         |
| `"allowlist"` | केवल `allowFrom` में सूचीबद्ध उपयोगकर्ता चैट कर सकते हैं                                                                     |
| `"open"`      | सार्वजनिक DM; कॉन्फ़िग सत्यापन के लिए `allowFrom` में `"*"` शामिल होना आवश्यक है। गैर-वाइल्डकार्ड प्रविष्टियाँ फिर भी अभिगम को सीमित करती हैं |

**पेयरिंग अनुरोध स्वीकृत करें:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### समूह चैट

**समूह नीति** (`channels.feishu.groupPolicy`, डिफ़ॉल्ट: `allowlist`):

| मान         | व्यवहार                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | समूहों के सभी संदेशों का उत्तर दें                                                            |
| `"allowlist"` | केवल `groupAllowFrom` में मौजूद या `groups.<chat_id>` के अंतर्गत स्पष्ट रूप से कॉन्फ़िगर किए गए समूहों को उत्तर दें |
| `"disabled"`  | सभी समूह संदेश अक्षम करें; स्पष्ट `groups.<chat_id>` प्रविष्टियाँ इसे ओवरराइड नहीं करतीं         |

**उल्लेख की आवश्यकता** (`channels.feishu.requireMention`):

- डिफ़ॉल्ट: @mention आवश्यक है, सिवाय इसके कि प्रभावी समूह नीति `"open"` हो; वहाँ यह डिफ़ॉल्ट रूप से `false` होता है, ताकि ऐसे संदेश जिनमें उल्लेख नहीं हो सकता (उदाहरण के लिए चित्र) फिर भी एजेंट तक पहुँचें।
- ओवरराइड करने के लिए `true` या `false` स्पष्ट रूप से सेट करें; प्रति-समूह ओवरराइड: `channels.feishu.groups.<chat_id>.requireMention`।
- केवल-प्रसारण `@all` और `@_all` को बॉट उल्लेख नहीं माना जाता। ऐसा संदेश जिसमें `@all` और सीधे बॉट, दोनों का उल्लेख हो, फिर भी बॉट उल्लेख माना जाता है।

## समूह कॉन्फ़िगरेशन के उदाहरण

### सभी समूहों को अनुमति दें, @mention आवश्यक नहीं

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // "open" के अंतर्गत requireMention डिफ़ॉल्ट रूप से false होता है
    },
  },
}
```

### सभी समूहों को अनुमति दें, फिर भी @mention आवश्यक हो

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
      // समूह ID इस तरह दिखाई देते हैं: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

`allowlist` मोड में, आप एक स्पष्ट `groups.<chat_id>` प्रविष्टि जोड़कर भी किसी समूह को अनुमति दे सकते हैं। स्पष्ट प्रविष्टियाँ `groupPolicy: "disabled"` को ओवरराइड नहीं करतीं। `groups.*` के अंतर्गत वाइल्डकार्ड डिफ़ॉल्ट मेल खाने वाले समूहों को कॉन्फ़िगर करते हैं, लेकिन वे अपने आप समूहों को अनुमति नहीं देते।

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

### किसी समूह के भीतर प्रेषकों को सीमित करें

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // उपयोगकर्ता open_id इस तरह दिखाई देते हैं: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

`channels.feishu.groupSenderAllowFrom` सभी समूहों के लिए समान प्रेषक अनुमति-सूची सेट करता है; प्रति-समूह `allowFrom` को प्राथमिकता मिलती है।

<a id="get-groupuser-ids"></a>

## समूह/उपयोगकर्ता ID प्राप्त करें

### समूह ID (`chat_id`, प्रारूप: `oc_xxx`)

Feishu/Lark में समूह खोलें, ऊपर-दाएँ कोने में मेनू आइकन पर क्लिक करें और **Settings** पर जाएँ। समूह ID (`chat_id`) सेटिंग्स पृष्ठ पर सूचीबद्ध है।

![समूह ID प्राप्त करें](/images/feishu-get-group-id.png)

### उपयोगकर्ता ID (`open_id`, प्रारूप: `ou_xxx`)

Gateway शुरू करें, बॉट को DM भेजें और फिर लॉग जाँचें:

```bash
openclaw logs --follow
```

लॉग आउटपुट में `open_id` खोजें। आप लंबित पेयरिंग अनुरोध भी जाँच सकते हैं:

```bash
openclaw pairing list feishu
```

## सामान्य कमांड

| कमांड   | विवरण                 |
| --------- | --------------------------- |
| `/status` | बॉट की स्थिति दिखाएँ             |
| `/reset`  | वर्तमान सत्र रीसेट करें   |
| `/model`  | AI मॉडल दिखाएँ या बदलें |

<Note>
Feishu/Lark नेटिव स्लैश-कमांड मेनू का समर्थन नहीं करता, इसलिए इन्हें सादे टेक्स्ट संदेशों के रूप में भेजें।
</Note>

## समस्या निवारण

### बॉट समूह चैट में उत्तर नहीं देता

1. सुनिश्चित करें कि बॉट समूह में जोड़ा गया है
2. सुनिश्चित करें कि आप बॉट को @mention करते हैं (डिफ़ॉल्ट रूप से आवश्यक)
3. सत्यापित करें कि `groupPolicy`, `"disabled"` नहीं है
4. लॉग जाँचें: `openclaw logs --follow`

### बॉट को संदेश प्राप्त नहीं होते

1. सुनिश्चित करें कि बॉट Feishu Open Platform / Lark Developer में प्रकाशित और स्वीकृत है
2. सुनिश्चित करें कि इवेंट सदस्यता में `im.message.receive_v1` शामिल है
3. सुनिश्चित करें कि **persistent connection** (WebSocket) चयनित है
4. सुनिश्चित करें कि सभी आवश्यक अनुमति स्कोप प्रदान किए गए हैं
5. सुनिश्चित करें कि Gateway चल रहा है: `openclaw gateway status`
6. लॉग जाँचें: `openclaw logs --follow`

### Feishu मोबाइल ऐप में QR सेटअप प्रतिक्रिया नहीं करता

1. सेटअप दोबारा चलाएँ: `openclaw channels login --channel feishu`
2. मैन्युअल सेटअप चुनें
3. Feishu Open Platform में स्वयं-निर्मित ऐप बनाएँ और उसका App ID तथा App Secret कॉपी करें
4. वे क्रेडेंशियल सेटअप विज़ार्ड में पेस्ट करें

### App Secret लीक हो गया

1. Feishu Open Platform / Lark Developer में App Secret रीसेट करें
2. अपने कॉन्फ़िग में मान अपडेट करें
3. Gateway पुनः आरंभ करें: `openclaw gateway restart`

## उन्नत कॉन्फ़िगरेशन

### एकाधिक खाते

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

`defaultAccount` नियंत्रित करता है कि जब आउटबाउंड API कोई `accountId` निर्दिष्ट नहीं करते, तब कौन-सा खाता उपयोग किया जाए। खाता प्रविष्टियाँ शीर्ष-स्तरीय सेटिंग्स इनहेरिट करती हैं; अधिकांश शीर्ष-स्तरीय कुंजियाँ प्रति खाते ओवरराइड की जा सकती हैं।
`accounts.<id>.tts`, `messages.tts` के समान संरचना का उपयोग करता है और वैश्विक TTS कॉन्फ़िग पर डीप-मर्ज होता है, ताकि बहु-बॉट Feishu सेटअप साझा प्रदाता क्रेडेंशियल को वैश्विक रूप से रख सकें और प्रति खाते केवल वॉइस, मॉडल, पर्सोना या ऑटो मोड ओवरराइड कर सकें।

### संदेश सीमाएँ

- `textChunkLimit` - आउटबाउंड टेक्स्ट खंड का आकार (डिफ़ॉल्ट: `4000` वर्ण)
- `streaming.chunkMode` - `"length"` (डिफ़ॉल्ट) सीमा पर विभाजित करता है; `"newline"` नई पंक्ति की सीमाओं को प्राथमिकता देता है
- `mediaMaxMb` - मीडिया अपलोड/डाउनलोड सीमा (डिफ़ॉल्ट: `30` MB)

### स्ट्रीमिंग

Feishu/Lark इंटरैक्टिव कार्ड (Card Kit स्ट्रीमिंग API) के माध्यम से स्ट्रीमिंग उत्तरों का समर्थन करता है। सक्षम होने पर, बॉट टेक्स्ट जनरेट करते समय कार्ड को रीयल टाइम में अपडेट करता है।

```json5
{
  channels: {
    feishu: {
      streaming: {
        mode: "partial", // स्ट्रीमिंग कार्ड आउटपुट (डिफ़ॉल्ट: "partial")
        block: { enabled: true }, // पूर्ण-ब्लॉक स्ट्रीमिंग के लिए ऑप्ट इन करें
      },
    },
  },
}
```

पूरा उत्तर एक संदेश में भेजने के लिए `streaming.mode: "off"` सेट करें; `renderMode: "raw"` (कार्ड के बजाय सादा टेक्स्ट) भी स्ट्रीमिंग कार्ड अक्षम करता है। `streaming.block.enabled` डिफ़ॉल्ट रूप से बंद है; इसे केवल तब सक्षम करें जब आप अंतिम उत्तर से पहले पूर्ण सहायक ब्लॉक फ़्लश करना चाहते हों। पुराने बूलियन `streaming` और समतल `blockStreaming` / `blockStreamingCoalesce` / `chunkMode` कुंजियाँ `openclaw doctor --fix` के माध्यम से इस नेस्टेड संरचना में माइग्रेट होती हैं।

### कोटा अनुकूलन

दो वैकल्पिक फ़्लैग के साथ Feishu/Lark API कॉल की संख्या घटाएँ:

- `typingIndicator` (डिफ़ॉल्ट `true`): टाइपिंग प्रतिक्रिया कॉल छोड़ने के लिए `false` सेट करें
- `resolveSenderNames` (डिफ़ॉल्ट `true`): प्रेषक प्रोफ़ाइल लुकअप छोड़ने के लिए `false` सेट करें

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

### समूह सत्र का दायरा और विषय थ्रेड

`channels.feishu.groupSessionScope` (शीर्ष-स्तर, प्रति खाता या प्रति समूह) नियंत्रित करता है कि समूह संदेश एजेंट सत्रों से कैसे मैप होते हैं:

| मान                  | सत्र                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `"group"` (डिफ़ॉल्ट)    | प्रत्येक समूह चैट के लिए एक सत्र                                       |
| `"group_sender"`       | प्रत्येक (समूह + प्रेषक) के लिए एक सत्र                                 |
| `"group_topic"`        | प्रत्येक विषय थ्रेड के लिए एक सत्र; उपलब्ध न होने पर समूह सत्र का उपयोग    |
| `"group_topic_sender"` | प्रत्येक (विषय + प्रेषक) के लिए एक सत्र; उपलब्ध न होने पर (समूह + प्रेषक) का उपयोग |

विषय दायरों के लिए, नेटिव Feishu/Lark विषय समूह इवेंट `thread_id` (`omt_*`) को कैनोनिकल विषय सत्र कुंजी के रूप में उपयोग करते हैं। यदि किसी नेटिव विषय आरंभकर्ता इवेंट में `thread_id` नहीं है, तो OpenClaw टर्न रूट करने से पहले उसे Feishu से प्राप्त करता है। सामान्य समूह उत्तर जिन्हें OpenClaw थ्रेड में बदलता है, उत्तर के मूल संदेश ID (`om_*`) का उपयोग जारी रखते हैं, ताकि पहला टर्न और अनुवर्ती टर्न एक ही सत्र में रहें।

बॉट के उत्तरों को इनलाइन उत्तर देने के बजाय Feishu विषय थ्रेड बनाने या जारी रखने के लिए `replyInThread: "enabled"` (शीर्ष-स्तर या प्रति समूह) सेट करें। `topicSessionMode`, `groupSessionScope` का बहिष्कृत पूर्ववर्ती है; `groupSessionScope` को प्राथमिकता दें।

### Feishu कार्यस्थान टूल

Plugin में Feishu दस्तावेज़ों, चैट, ज्ञानकोश, क्लाउड स्टोरेज, अनुमतियों और Bitable के लिए एजेंट टूल, साथ ही संबंधित Skills (`feishu-doc`, `feishu-drive`, `feishu-perm`, `feishu-wiki`) शामिल हैं। टूल परिवारों को `channels.feishu.tools` द्वारा नियंत्रित किया जाता है:

| कुंजी             | टूल                                         | डिफ़ॉल्ट             |
| --------------- | --------------------------------------------- | ------------------- |
| `tools.doc`     | `feishu_doc` दस्तावेज़ संचालन              | `true`              |
| `tools.chat`    | `feishu_chat` चैट जानकारी + सदस्य क्वेरी      | `true`              |
| `tools.wiki`    | `feishu_wiki` ज्ञान आधार (`doc` आवश्यक) | `true`              |
| `tools.drive`   | `feishu_drive` क्लाउड स्टोरेज                  | `true`              |
| `tools.perm`    | `feishu_perm` अनुमति प्रबंधन           | `false` (संवेदनशील) |
| `tools.scopes`  | `feishu_app_scopes` ऐप स्कोप निदान     | `true`              |
| `tools.bitable` | `feishu_bitable_*` Bitable/Base संचालन    | `true`              |

`tools.base`, `tools.bitable` का उपनाम है; दोनों सेट होने पर स्पष्ट `bitable` मान प्रभावी होता है। प्रति-अकाउंट गेट `accounts.<id>.tools` के अंतर्गत होते हैं।

रूट डायरेक्टरी के बाहर सीधे `feishu_drive info` लुकअप के लिए `drive:drive.metadata:readonly` प्रदान करें,
जब तक कि ऐप के पास पहले से पूर्ण `drive:drive` स्कोप न हो। दोनों में से कोई स्कोप न होने पर, `info`
`drive:drive:readonly` के माध्यम से लीगेसी रूट-डायरेक्टरी लुकअप उपलब्ध रखता है।

### ACP सत्र

Feishu/Lark, DM और समूह थ्रेड संदेशों के लिए ACP का समर्थन करता है। Feishu/Lark ACP टेक्स्ट कमांड से संचालित होता है—इसमें नेटिव स्लैश-कमांड मेनू नहीं हैं, इसलिए बातचीत में सीधे `/acp ...` संदेशों का उपयोग करें।

#### स्थायी ACP बाइंडिंग

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

#### चैट से ACP शुरू करना

किसी Feishu/Lark DM या थ्रेड में:

```text
/acp spawn codex --thread here
```

`--thread here`, DM और Feishu/Lark थ्रेड संदेशों के लिए काम करता है। बाइंड की गई बातचीत के अनुवर्ती संदेश सीधे उस ACP सत्र पर रूट होते हैं।

### मल्टी-एजेंट रूटिंग

Feishu/Lark DM या समूहों को अलग-अलग एजेंटों पर रूट करने के लिए `bindings` का उपयोग करें।

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

रूटिंग फ़ील्ड:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) या `"group"` (समूह चैट)
- `match.peer.id`: उपयोगकर्ता Open ID (`ou_xxx`) या समूह ID (`oc_xxx`)

लुकअप संबंधी सुझावों के लिए [समूह/उपयोगकर्ता ID प्राप्त करें](#get-groupuser-ids) देखें।

## प्रति-उपयोगकर्ता एजेंट पृथक्करण (डायनेमिक एजेंट निर्माण)

प्रत्येक DM उपयोगकर्ता के लिए स्वचालित रूप से **पृथक एजेंट इंस्टेंस** बनाने हेतु `dynamicAgentCreation` सक्षम करें। प्रत्येक उपयोगकर्ता को अपना अलग मिलता है:

- स्वतंत्र वर्कस्पेस डायरेक्टरी
- अलग `USER.md` / `SOUL.md` / `MEMORY.md`
- निजी बातचीत इतिहास
- पृथक कौशल और स्थिति

यह उन सार्वजनिक बॉट के लिए आवश्यक है जहाँ प्रत्येक उपयोगकर्ता को अपना निजी AI सहायक अनुभव देना हो।

<Note>
डायनेमिक बाइंडिंग में सामान्यीकृत Feishu `accountId` शामिल होता है, इसलिए डिफ़ॉल्ट और नामित अकाउंट प्रत्येक प्रेषक को सही डायनेमिक एजेंट पर रूट करते हैं।

यदि किसी नामित अकाउंट ने पुराने रिलीज़ पर बिना स्कोप वाला डायनेमिक एजेंट बनाया था, तो वह लीगेसी एजेंट अब भी `maxAgents` में गिना जाता है। उसे हटाने से पहले पुष्टि करें कि डिफ़ॉल्ट अकाउंट उसका उपयोग नहीं करता, या अस्थायी रूप से `maxAgents` बढ़ाएँ; OpenClaw सुरक्षित रूप से यह अनुमान नहीं लगा सकता कि अस्पष्ट लीगेसी स्थिति का स्वामी कौन-सा अकाउंट है।
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
    // महत्वपूर्ण: प्रत्येक उपयोगकर्ता के DM को उसका "मुख्य सत्र" बनाता है
    // USER.md / SOUL.md / MEMORY.md को स्वचालित रूप से लोड करता है
    // अधिक सुदृढ़ पृथक्करण के लिए इसके बजाय "per-channel-peer" का उपयोग करें
    dmScope: "main",
  },
}
```

### यह कैसे काम करता है

जब कोई नया उपयोगकर्ता अपना पहला DM भेजता है:

1. चैनल एक अद्वितीय `agentId` उत्पन्न करता है: डिफ़ॉल्ट अकाउंट के लिए `feishu-{user_open_id}`, या नामित अकाउंट के लिए सीमाबद्ध अकाउंट-प्रीफ़िक्स वाला पहचान डाइजेस्ट
2. `workspaceTemplate` पथ पर नया वर्कस्पेस बनाता है
3. एजेंट को पंजीकृत करता है और इस उपयोगकर्ता के लिए बाइंडिंग बनाता है
4. वर्कस्पेस हेल्पर पहली पहुँच पर बूटस्ट्रैप फ़ाइलें (`AGENTS.md`, `SOUL.md`, `USER.md`, आदि) सुनिश्चित करता है
5. इस उपयोगकर्ता के सभी भावी संदेशों को उसके समर्पित एजेंट पर रूट करता है

### कॉन्फ़िगरेशन विकल्प

| सेटिंग                                                  | विवरण                                | डिफ़ॉल्ट                              |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | स्वचालित प्रति-उपयोगकर्ता एजेंट निर्माण सक्षम करें   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | डायनेमिक एजेंट वर्कस्पेस के लिए पथ टेम्पलेट | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | एजेंट डायरेक्टरी नाम का टेम्पलेट              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | बनाए जाने वाले डायनेमिक एजेंटों की अधिकतम संख्या | असीमित                            |

टेम्पलेट चर:

- `{agentId}` - उत्पन्न एजेंट ID (उदा., `feishu-ou_xxxxxx` या `feishu-support-<identity_digest>`)
- `{userId}` - प्रेषक का Feishu open_id (उदा., `ou_xxxxxx`)

### सत्र स्कोप

`session.dmScope` नियंत्रित करता है कि डायरेक्ट संदेश एजेंट सत्रों पर कैसे मैप किए जाते हैं। यह एक **वैश्विक सेटिंग** है जो सभी चैनलों को प्रभावित करती है।

| मान                        | व्यवहार                                                            | इनके लिए सर्वोत्तम                                                           |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | प्रत्येक उपयोगकर्ता का DM उसके एजेंट के मुख्य सत्र पर मैप होता है                   | एकल-उपयोगकर्ता बॉट, जहाँ `USER.md` / `SOUL.md` को स्वतः लोड करना हो |
| `"per-peer"`                 | प्रत्येक पीयर को अलग सत्र मिलता है (चैनल चाहे जो हो)           | केवल प्रेषक पहचान पर आधारित पृथक्करण                            |
| `"per-channel-peer"`         | प्रत्येक (चैनल + उपयोगकर्ता) संयोजन को अलग सत्र मिलता है           | अधिक सुदृढ़ पृथक्करण की आवश्यकता वाले सार्वजनिक मल्टी-यूज़र बॉट                  |
| `"per-account-channel-peer"` | प्रत्येक (अकाउंट + चैनल + उपयोगकर्ता) संयोजन को अलग सत्र मिलता है | अकाउंट-स्तरीय सत्र पृथक्करण की आवश्यकता वाले मल्टी-अकाउंट बॉट         |

**समझौता**: `"main"` का उपयोग स्वचालित बूटस्ट्रैप फ़ाइल लोडिंग (`USER.md`, `SOUL.md`, `MEMORY.md`) सक्षम करता है, लेकिन इसका अर्थ है कि सभी चैनलों के सभी DM समान सत्र कुंजी पैटर्न साझा करते हैं। उन सार्वजनिक मल्टी-यूज़र बॉट के लिए जहाँ पृथक्करण बूटस्ट्रैप स्वतः लोड होने से अधिक महत्वपूर्ण है, `"per-channel-peer"` पर विचार करें और बूटस्ट्रैप फ़ाइलों को मैन्युअल रूप से प्रबंधित करें।

<Note>
जब नामित Feishu अकाउंट को एक ही प्रेषक के लिए अलग सत्र रखने हों, तो `"per-account-channel-peer"` का उपयोग करें। डायनेमिक बाइंडिंग अकाउंट स्कोप को संरक्षित रखती हैं।
</Note>

### सामान्य मल्टी-यूज़र डिप्लॉयमेंट

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
    // अपनी पृथक्करण आवश्यकताओं के आधार पर dmScope चुनें:
    // बूटस्ट्रैप स्वतः लोड होने के लिए "main", अधिक सुदृढ़ पृथक्करण के लिए "per-channel-peer"
    dmScope: "main",
  },
  bindings: [], // खाली - डायनेमिक एजेंट स्वतः बाइंड होते हैं
}
```

### सत्यापन

डायनेमिक निर्माण के काम करने की पुष्टि करने के लिए Gateway लॉग जाँचें:

```text
feishu: उपयोगकर्ता ou_xxxxxx के लिए डायनेमिक एजेंट "feishu-ou_xxxxxx" बनाया जा रहा है
  वर्कस्पेस: /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  agentDir: /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

बनाए गए सभी वर्कस्पेस सूचीबद्ध करें:

```bash
ls -la ~/.openclaw/workspace-*
```

### टिप्पणियाँ

- **वर्कस्पेस पृथक्करण**: प्रत्येक उपयोगकर्ता को अपनी वर्कस्पेस डायरेक्टरी और एजेंट इंस्टेंस मिलता है। सामान्य संदेश प्रवाह में उपयोगकर्ता एक-दूसरे का बातचीत इतिहास या फ़ाइलें नहीं देख सकते।
- **सुरक्षा सीमा**: यह संदेश-संदर्भ पृथक्करण तंत्र है, शत्रुतापूर्ण सह-किरायेदार सुरक्षा सीमा नहीं। एजेंट प्रक्रिया और होस्ट परिवेश साझा होते हैं।
- **कॉन्फ़िगरेशन लेखन सक्षम रहना चाहिए**: डायनेमिक एजेंट निर्माण एजेंटों और बाइंडिंग को कॉन्फ़िगरेशन में लिखता है; जब `channels.feishu.configWrites`, `false` हो, तो इसे छोड़ दिया जाता है (डिफ़ॉल्ट: सक्षम)।
- **`bindings` खाली होना चाहिए**: डायनेमिक एजेंट अपनी बाइंडिंग स्वयं पंजीकृत करते हैं
- **अपग्रेड पथ**: मौजूदा मैन्युअल बाइंडिंग डायनेमिक एजेंटों के साथ काम करती रहती हैं
- **`session.dmScope` वैश्विक है**: यह केवल Feishu को नहीं, बल्कि सभी चैनलों को प्रभावित करता है

## कॉन्फ़िगरेशन संदर्भ

पूर्ण कॉन्फ़िगरेशन: [Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration)

| सेटिंग                                                  | विवरण                                                                          | डिफ़ॉल्ट                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | चैनल को सक्षम/अक्षम करें                                                           | `true`                               |
| `channels.feishu.domain`                                 | API डोमेन (`feishu`, `lark`, या एक `https://` आधार URL)                             | `feishu`                             |
| `channels.feishu.connectionMode`                         | इवेंट ट्रांसपोर्ट (`websocket` या `webhook`)                                           | `websocket`                          |
| `channels.feishu.defaultAccount`                         | आउटबाउंड रूटिंग के लिए डिफ़ॉल्ट खाता                                                 | `default`                            |
| `channels.feishu.verificationToken`                      | Webhook मोड के लिए आवश्यक                                                            | -                                    |
| `channels.feishu.encryptKey`                             | Webhook मोड के लिए आवश्यक                                                            | -                                    |
| `channels.feishu.webhookPath`                            | Webhook रूट पथ                                                                   | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Webhook बाइंड होस्ट                                                                    | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Webhook बाइंड पोर्ट                                                                    | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | ऐप ID                                                                               | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | ऐप सीक्रेट                                                                           | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | प्रति-खाता डोमेन ओवरराइड                                                          | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | प्रति-खाता TTS ओवरराइड                                                             | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | DM नीति (`pairing`, `allowlist`, `open`)                                           | `pairing`                            |
| `channels.feishu.allowFrom`                              | DM अनुमति-सूची (open_id सूची)                                                          | -                                    |
| `channels.feishu.groupPolicy`                            | समूह नीति (`open`, `allowlist`, `disabled`)                                       | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | समूह अनुमति-सूची                                                                      | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | सभी समूहों पर लागू प्रेषक अनुमति-सूची                                               | -                                    |
| `channels.feishu.requireMention`                         | समूहों में @mention आवश्यक करें                                                           | `true` (जब नीति `open` हो तब `false`)  |
| `channels.feishu.groups.<chat_id>.requireMention`        | प्रति-समूह @mention ओवरराइड; स्पष्ट ID अनुमति-सूची मोड में समूह को भी प्रवेश देते हैं     | इनहेरिट किया गया                            |
| `channels.feishu.groups.<chat_id>.enabled`               | किसी विशिष्ट समूह को सक्षम/अक्षम करें                                                      | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | प्रति-समूह प्रेषक अनुमति-सूची (`groupSenderAllowFrom` को ओवरराइड करती है)                        | -                                    |
| `channels.feishu.groupSessionScope`                      | समूह सत्र मैपिंग (`group`, `group_sender`, `group_topic`, `group_topic_sender`) | `group`                              |
| `channels.feishu.replyInThread`                          | बॉट उत्तर विषय थ्रेड बनाते/जारी रखते हैं (`disabled`, `enabled`)                    | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | इनबाउंड प्रतिक्रिया इवेंट (`off`, `own`, `all`)                                        | `own`                                |
| `channels.feishu.dynamicAgentCreation.enabled`           | स्वचालित प्रति-उपयोगकर्ता एजेंट निर्माण सक्षम करें                                             | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | डायनेमिक एजेंट कार्यस्थानों के लिए पथ टेम्पलेट                                           | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | एजेंट डायरेक्टरी नाम टेम्पलेट                                                        | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | बनाए जाने वाले डायनेमिक एजेंटों की अधिकतम संख्या                                           | असीमित                            |
| `channels.feishu.textChunkLimit`                         | संदेश खंड आकार                                                                   | `4000`                               |
| `channels.feishu.streaming.chunkMode`                    | खंड विभाजन (`length` या `newline`)                                              | `length`                             |
| `channels.feishu.mediaMaxMb`                             | मीडिया आकार सीमा                                                                     | `30`                                 |
| `channels.feishu.renderMode`                             | उत्तर रेंडरिंग (`auto`, `raw`, `card`)                                              | `auto`                               |
| `channels.feishu.streaming.mode`                         | स्ट्रीमिंग कार्ड आउटपुट (`partial` या `off`)                                           | `partial`                            |
| `channels.feishu.streaming.block.enabled`                | पूर्ण-ब्लॉक उत्तर स्ट्रीमिंग                                                      | `false`                              |
| `channels.feishu.typingIndicator`                        | टाइपिंग प्रतिक्रियाएँ भेजें                                                                | `true`                               |
| `channels.feishu.resolveSenderNames`                     | प्रेषक के प्रदर्शन नाम हल करें                                                         | `true`                               |
| `channels.feishu.configWrites`                           | चैनल द्वारा आरंभ किए गए कॉन्फ़िगरेशन लेखन की अनुमति दें (डायनेमिक एजेंटों के लिए आवश्यक)                     | `true`                               |
| `channels.feishu.tools.doc`                              | दस्तावेज़ टूल सक्षम करें                                                                | `true`                               |
| `channels.feishu.tools.chat`                             | चैट जानकारी टूल सक्षम करें                                                               | `true`                               |
| `channels.feishu.tools.wiki`                             | ज्ञान आधार टूल सक्षम करें (`doc` आवश्यक है)                                         | `true`                               |
| `channels.feishu.tools.drive`                            | क्लाउड स्टोरेज टूल सक्षम करें                                                           | `true`                               |
| `channels.feishu.tools.perm`                             | अनुमति प्रबंधन टूल सक्षम करें                                                   | `false`                              |
| `channels.feishu.tools.scopes`                           | ऐप स्कोप डायग्नोस्टिक टूल सक्षम करें                                                    | `true`                               |
| `channels.feishu.tools.bitable`                          | Bitable/Base टूल सक्षम करें                                                            | `true`                               |
| `channels.feishu.tools.base`                             | `channels.feishu.tools.bitable` का उपनाम; दोनों सेट होने पर स्पष्ट `bitable` को प्राथमिकता मिलती है     | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | प्रति-खाता Bitable/Base टूल गेट                                                   | इनहेरिट किया गया                            |
| `channels.feishu.accounts.<id>.tools.base`               | `tools.bitable` का प्रति-खाता उपनाम                                                | इनहेरिट किया गया                            |

## समर्थित संदेश प्रकार

### प्राप्त करना

- ✅ टेक्स्ट
- ✅ रिच टेक्स्ट (पोस्ट)
- ✅ छवियाँ
- ✅ फ़ाइलें
- ✅ ऑडियो
- ✅ वीडियो/मीडिया
- ✅ स्टिकर

इनबाउंड Feishu/Lark ऑडियो संदेशों को अपरिष्कृत `file_key` JSON के बजाय
मीडिया प्लेसहोल्डर के रूप में सामान्यीकृत किया जाता है। जब `tools.media.audio` कॉन्फ़िगर किया गया हो, OpenClaw
वॉइस-नोट संसाधन डाउनलोड करता है और एजेंट टर्न से पहले साझा ऑडियो ट्रांसक्रिप्शन चलाता है,
ताकि एजेंट को बोले गए शब्दों का ट्रांसक्रिप्ट मिले। यदि Feishu ऑडियो पेलोड में
ट्रांसक्रिप्ट टेक्स्ट सीधे शामिल करता है, तो उस टेक्स्ट का उपयोग किसी अन्य
ASR कॉल के बिना किया जाता है। ऑडियो ट्रांसक्रिप्शन प्रदाता के बिना भी एजेंट को
सहेजे गए अटैचमेंट के साथ एक `<media:audio>` प्लेसहोल्डर मिलता है, न कि अपरिष्कृत Feishu
संसाधन पेलोड।

### भेजना

- ✅ टेक्स्ट
- ✅ छवियाँ
- ✅ फ़ाइलें
- ✅ ऑडियो
- ✅ वीडियो/मीडिया
- ✅ इंटरैक्टिव कार्ड (स्ट्रीमिंग अपडेट सहित)
- ⚠️ रिच टेक्स्ट (पोस्ट-शैली फ़ॉर्मेटिंग; पूर्ण Feishu/Lark लेखन क्षमताओं का समर्थन नहीं करता)

नेटिव Feishu/Lark ऑडियो बबल Feishu `audio` संदेश प्रकार का उपयोग करते हैं और उनके लिए
Ogg/Opus अपलोड मीडिया (`file_type: "opus"`) आवश्यक है। मौजूदा `.opus` और `.ogg` मीडिया
सीधे नेटिव ऑडियो के रूप में भेजे जाते हैं। MP3/WAV/M4A और अन्य संभावित ऑडियो प्रारूपों को
`ffmpeg` के साथ 48kHz Ogg/Opus में केवल तभी ट्रांसकोड किया जाता है, जब उत्तर में वॉइस
डिलीवरी का अनुरोध हो (`audioAsVoice` / संदेश टूल `asVoice`, TTS वॉइस-नोट
उत्तरों सहित)। सामान्य MP3 अटैचमेंट नियमित फ़ाइलें बने रहते हैं। यदि `ffmpeg` अनुपलब्ध हो या
रूपांतरण विफल हो जाए, तो OpenClaw फ़ाइल अटैचमेंट का उपयोग करता है और कारण लॉग करता है।

### थ्रेड और उत्तर

- ✅ इनलाइन उत्तर
- ✅ थ्रेड उत्तर
- ✅ किसी थ्रेड संदेश का उत्तर देते समय मीडिया उत्तर थ्रेड-संदर्भ बनाए रखते हैं

विषय-समूह सत्र रूटिंग का विवरण
[समूह सत्र का दायरा और विषय थ्रेड](#group-session-scope-and-topic-threads) में दिया गया है।

## संबंधित

- [चैनलों का अवलोकन](/hi/channels) - सभी समर्थित चैनल
- [पेयरिंग](/hi/channels/pairing) - DM प्रमाणीकरण और पेयरिंग प्रवाह
- [समूह](/hi/channels/groups) - समूह चैट व्यवहार और उल्लेख गेटिंग
- [चैनल रूटिंग](/hi/channels/channel-routing) - संदेशों के लिए सत्र रूटिंग
- [सुरक्षा](/hi/gateway/security) - अभिगम मॉडल और सुदृढ़ीकरण
