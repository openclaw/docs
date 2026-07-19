---
read_when:
    - आप Feishu/Lark बॉट कनेक्ट करना चाहते हैं
    - आप Feishu चैनल कॉन्फ़िगर कर रहे हैं
summary: Feishu बॉट का अवलोकन, सुविधाएँ और कॉन्फ़िगरेशन
title: Feishu
x-i18n:
    generated_at: "2026-07-19T07:58:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 907f99245ec1d5d038362636def039b16225f90ab9d8ec9d61d08f16495a1710
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw आधिकारिक `@openclaw/feishu` Plugin के माध्यम से Feishu/Lark (ऑल-इन-वन सहयोग प्लेटफ़ॉर्म) से जुड़ता है: बॉट DM, समूह चैट, स्ट्रीमिंग कार्ड उत्तर और Feishu दस्तावेज़/wiki/drive/Bitable टूल।

**स्थिति:** बॉट DM + समूह चैट के लिए प्रोडक्शन-तैयार। WebSocket डिफ़ॉल्ट इवेंट ट्रांसपोर्ट है (किसी सार्वजनिक URL की आवश्यकता नहीं); webhook मोड वैकल्पिक है।

## त्वरित शुरुआत

<Note>
OpenClaw 2026.5.29 या उसके बाद का संस्करण आवश्यक है। जाँचने के लिए `openclaw --version` चलाएँ। `openclaw update` से अपग्रेड करें।
</Note>

<Steps>
  <Step title="चैनल सेटअप विज़ार्ड चलाएँ">
  ```bash
  openclaw channels login --channel feishu
  ```
  यदि `@openclaw/feishu` Plugin मौजूद नहीं है, तो यह उसे इंस्टॉल करता है और फिर सेटअप के चरणों से आपका मार्गदर्शन करता है:

- **मैन्युअल सेटअप**: Feishu Open Platform (`https://open.feishu.cn`) या Lark Developer (`https://open.larksuite.com`) से App ID और App Secret पेस्ट करें।
- **QR सेटअप**: स्वचालित रूप से बॉट बनाने के लिए Feishu ऐप में QR कोड स्कैन करें। यह प्रवाह DM को केवल आपके अपने अकाउंट तक सीमित कर देता है (आपके `open_id` के साथ `dmPolicy: "allowlist"`)।

विज़ार्ड API डोमेन (Feishu या Lark) और समूह नीति भी पूछता है। यदि घरेलू Feishu मोबाइल ऐप QR कोड पर प्रतिक्रिया नहीं देता, तो सेटअप दोबारा चलाएँ और मैन्युअल सेटअप चुनें।
</Step>

  <Step title="सेटअप पूरा होने के बाद, बदलाव लागू करने के लिए Gateway पुनः आरंभ करें">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## इनबाउंड स्थायित्व

OpenClaw एजेंट को प्रेषित करने से पहले प्रमाणित `im.message.receive_v1` और `drive.notice.comment_add_v1` एनवेलप को टिकाऊ रूप से कतार में रखता है। लंबित या पुनः प्रयास योग्य इवेंट Gateway के पुनः आरंभ होने पर भी बने रहते हैं, प्रत्येक चैट या दस्तावेज़ के अनुसार क्रमबद्ध रहते हैं और सक्रिय या संरक्षित पूर्णता रिकॉर्ड मौजूद रहने तक डुप्लिकेट कतार प्रविष्टियों को रोकने के लिए Feishu की इवेंट ID का उपयोग करते हैं।

यदि सीमित पुनः प्रयासों के बाद भी WebSocket इवेंट को स्थायी नहीं किया जा सकता, तो OpenClaw उस सॉकेट को बंद कर देता है और कमिट न किए गए टर्न से आगे बढ़ने के बजाय नया प्रमाणित कनेक्शन बाध्य करता है। प्रतिक्रियाओं और VC मीटिंग आमंत्रणों सहित अन्य Feishu इवेंट प्रकार अपने सामान्य इवेंट पथों का उपयोग करते हैं और उन्हें इस टिकाऊ कतार की गारंटी नहीं मिलती।

## पहुँच नियंत्रण

### प्रत्यक्ष संदेश

बॉट को कौन DM कर सकता है, इसे नियंत्रित करने के लिए `channels.feishu.dmPolicy` (डिफ़ॉल्ट: `pairing`) कॉन्फ़िगर करें:

| मान         | व्यवहार                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | अज्ञात उपयोगकर्ताओं को पेयरिंग कोड मिलता है; CLI के माध्यम से स्वीकृत करें                                                         |
| `"allowlist"` | केवल `allowFrom` में सूचीबद्ध उपयोगकर्ता चैट कर सकते हैं                                                                     |
| `"open"`      | सार्वजनिक DM; कॉन्फ़िग सत्यापन के लिए `allowFrom` में `"*"` शामिल होना आवश्यक है। गैर-वाइल्डकार्ड प्रविष्टियाँ फिर भी पहुँच को सीमित करती हैं |

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
| `"allowlist"` | केवल `groupAllowFrom` में शामिल या `groups.<chat_id>` के अंतर्गत स्पष्ट रूप से कॉन्फ़िगर किए गए समूहों को उत्तर दें |
| `"disabled"`  | सभी समूह संदेश अक्षम करें; स्पष्ट `groups.<chat_id>` प्रविष्टियाँ इसे ओवरराइड नहीं करतीं         |

**उल्लेख की आवश्यकता** (`channels.feishu.requireMention`):

- डिफ़ॉल्ट: @उल्लेख आवश्यक है, सिवाय इसके कि प्रभावी समूह नीति `"open"` हो; वहाँ यह डिफ़ॉल्ट रूप से `false` होता है, ताकि ऐसे संदेश जिनमें उल्लेख नहीं हो सकता (उदाहरण के लिए चित्र) फिर भी एजेंट तक पहुँचें।
- ओवरराइड करने के लिए `true` या `false` स्पष्ट रूप से सेट करें; प्रति-समूह ओवरराइड: `channels.feishu.groups.<chat_id>.requireMention`।
- केवल-प्रसारण `@all` और `@_all` को बॉट उल्लेख नहीं माना जाता। ऐसा संदेश जिसमें `@all` और बॉट, दोनों का सीधे उल्लेख हो, फिर भी बॉट उल्लेख माना जाता है।

## समूह कॉन्फ़िगरेशन के उदाहरण

### सभी समूहों को अनुमति दें, @उल्लेख आवश्यक नहीं

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // "open" के अंतर्गत requireMention डिफ़ॉल्ट रूप से false होता है
    },
  },
}
```

### सभी समूहों को अनुमति दें, फिर भी @उल्लेख आवश्यक हो

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
      // समूह ID इस प्रकार दिखती हैं: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

`allowlist` मोड में, आप स्पष्ट `groups.<chat_id>` प्रविष्टि जोड़कर भी किसी समूह को अनुमति दे सकते हैं। स्पष्ट प्रविष्टियाँ `groupPolicy: "disabled"` को ओवरराइड नहीं करतीं। `groups.*` के अंतर्गत वाइल्डकार्ड डिफ़ॉल्ट मेल खाने वाले समूहों को कॉन्फ़िगर करते हैं, लेकिन वे स्वयं समूहों को अनुमति नहीं देते।

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

### समूह के भीतर प्रेषकों को सीमित करें

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // उपयोगकर्ता open_id इस प्रकार दिखती हैं: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

`channels.feishu.groupSenderAllowFrom` सभी समूहों के लिए समान प्रेषक अनुमति-सूची सेट करता है; प्रति-समूह `allowFrom` को प्राथमिकता मिलती है।

### बॉट द्वारा लिखे गए संदेश

Feishu डिफ़ॉल्ट रूप से अन्य बॉट द्वारा लिखे गए संदेशों को अनदेखा करता है। बॉट-से-बॉट समूह वार्तालापों की अनुमति देने के लिए, ऐप को `im:message.group_at_msg.include_bot:readonly` और `im:message:readonly` स्कोप प्रदान करें, फिर `allowBots` सेट करें:

```json5
{
  channels: {
    feishu: {
      allowBots: true,
    },
  },
}
```

Feishu बॉट द्वारा लिखे गए समूह इवेंट केवल तभी डिलीवर करता है, जब कोई अन्य बॉट इस बॉट का उल्लेख करता है। मौजूदा समूह नीति, प्रेषक अनुमति-सूचियाँ और उल्लेख आवश्यकताएँ फिर भी लागू होती हैं। OpenClaw स्वयं द्वारा लिखे गए संदेशों को हटा देता है, प्रत्येक टेक्स्ट या कार्ड उत्तर में सहकर्मी बॉट का उल्लेख करता है और साझा [`channels.defaults.botLoopProtection`](/hi/channels/bot-loop-protection) सुरक्षा लागू करता है।

<a id="get-groupuser-ids"></a>

## समूह/उपयोगकर्ता ID प्राप्त करें

### समूह ID (`chat_id`, प्रारूप: `oc_xxx`)

Feishu/Lark में समूह खोलें, ऊपरी-दाएँ कोने में मेनू आइकन पर क्लिक करें और **Settings** पर जाएँ। समूह ID (`chat_id`) सेटिंग पृष्ठ पर सूचीबद्ध होती है।

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
| `/reset`  | वर्तमान सेशन रीसेट करें   |
| `/model`  | AI मॉडल दिखाएँ या बदलें |

<Note>
Feishu/Lark नेटिव स्लैश-कमांड मेनू का समर्थन नहीं करता, इसलिए इन्हें सादे टेक्स्ट संदेशों के रूप में भेजें।
</Note>

## समस्या निवारण

### बॉट समूह चैट में उत्तर नहीं देता

1. सुनिश्चित करें कि बॉट समूह में जोड़ा गया है
2. सुनिश्चित करें कि आप बॉट का @उल्लेख करते हैं (डिफ़ॉल्ट रूप से आवश्यक)
3. सत्यापित करें कि `groupPolicy`, `"disabled"` नहीं है
4. लॉग जाँचें: `openclaw logs --follow`

### बॉट को संदेश प्राप्त नहीं होते

1. सुनिश्चित करें कि बॉट Feishu Open Platform / Lark Developer में प्रकाशित और स्वीकृत है
2. सुनिश्चित करें कि इवेंट सदस्यता में `im.message.receive_v1` शामिल है
3. मीटिंग आमंत्रण पर स्वतः जुड़ने के लिए, `vc.bot.meeting_invited_v1` की भी सदस्यता लें
4. सुनिश्चित करें कि **persistent connection** (WebSocket) चुना गया है
5. सुनिश्चित करें कि सभी आवश्यक अनुमति स्कोप प्रदान किए गए हैं
6. सुनिश्चित करें कि Gateway चल रहा है: `openclaw gateway status`
7. लॉग जाँचें: `openclaw logs --follow`

`vc.bot.meeting_invited_v1` की सदस्यता लेने से केवल इवेंट डिलीवर होता है। स्वचालित रूप से जुड़ना
डिफ़ॉल्ट रूप से बंद है। इसे वैश्विक रूप से सक्षम करने के लिए:

```json5
{
  channels: {
    feishu: {
      vcAutoJoin: true,
    },
  },
}
```

केवल एक अकाउंट के लिए सक्षम करने हेतु, शीर्ष-स्तरीय स्विच छोड़ दें और अकाउंट ओवरराइड सेट करें:

```json5
{
  channels: {
    feishu: {
      accounts: {
        meetings: { vcAutoJoin: true },
      },
    },
  },
}
```

एजेंट को जुड़ने का टर्न मिलने से पहले आमंत्रणकर्ता सामान्य Feishu DM नीति, अनुमति-सूची/पेयरिंग, सेशन और उत्तर
रूटिंग से होकर गुजरते हैं। जुड़ने के लिए ऐप पहचान के साथ कॉन्फ़िगर किया गया उपलब्ध Feishu VC जॉइन
टूल भी आवश्यक है, जिसके पास
`vc:meeting.bot.join:write` स्कोप हो। उदाहरण के लिए, आधिकारिक
[`lark-cli` VC एजेंट स्किल](https://github.com/larksuite/cli/tree/main/skills/lark-vc-agent)
`vc +meeting-join` प्रदान करती है।

<Warning>
आधिकारिक `lark-cli` VC एजेंट स्किल वर्तमान में मीटिंग-बॉट कार्रवाइयों को सीमित बीटा के रूप में चिह्नित करती है। यदि टूल `ErrNotInGray` या त्रुटि कोड `20017` लौटाता है, तो ऐप या टेनेंट को उस बीटा के लिए सक्षम नहीं किया गया है; सामान्य स्कोप अनुदानों का समस्या निवारण करने से पहले लिंक की गई स्किल में दिए गए अर्ली-एक्सेस मार्गदर्शन का उपयोग करें।
</Warning>

### Feishu मोबाइल ऐप में QR सेटअप प्रतिक्रिया नहीं देता

1. सेटअप दोबारा चलाएँ: `openclaw channels login --channel feishu`
2. मैन्युअल सेटअप चुनें
3. Feishu Open Platform में स्वयं-निर्मित ऐप बनाएँ और उसका App ID तथा App Secret कॉपी करें
4. वे क्रेडेंशियल सेटअप विज़ार्ड में पेस्ट करें

### App Secret लीक हो गया

1. Feishu Open Platform / Lark Developer में App Secret रीसेट करें
2. अपने कॉन्फ़िग में मान अपडेट करें
3. Gateway पुनः आरंभ करें: `openclaw gateway restart`

## उन्नत कॉन्फ़िगरेशन

### एकाधिक अकाउंट

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "प्राथमिक बॉट",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "बैकअप बॉट",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` नियंत्रित करता है कि जब आउटबाउंड API कोई `accountId` निर्दिष्ट न करें, तो किस अकाउंट का उपयोग किया जाए। अकाउंट प्रविष्टियाँ शीर्ष-स्तरीय सेटिंग प्राप्त करती हैं; अधिकांश शीर्ष-स्तरीय कुंजियों को प्रति अकाउंट ओवरराइड किया जा सकता है।
`accounts.<id>.tts`, `messages.tts` के समान संरचना का उपयोग करता है और वैश्विक TTS कॉन्फ़िग पर डीप-मर्ज होता है, इसलिए बहु-बॉट Feishu सेटअप साझा प्रदाता क्रेडेंशियल को वैश्विक रूप से रख सकते हैं, जबकि प्रत्येक अकाउंट के लिए केवल वॉइस, मॉडल, पर्सोना या ऑटो मोड को ओवरराइड कर सकते हैं।

### संदेश सीमाएँ

- `textChunkLimit` - आउटबाउंड टेक्स्ट खंड का आकार (डिफ़ॉल्ट: `4000` वर्ण)
- `streaming.chunkMode` - `"length"` (डिफ़ॉल्ट) सीमा पर विभाजित करता है; `"newline"` नई-पंक्ति सीमाओं को प्राथमिकता देता है
- `mediaMaxMb` - मीडिया अपलोड/डाउनलोड सीमा (डिफ़ॉल्ट: `30` MB)

### स्ट्रीमिंग

Feishu/Lark इंटरैक्टिव कार्ड (Card Kit स्ट्रीमिंग API) के माध्यम से स्ट्रीमिंग उत्तरों का समर्थन करता है। सक्षम होने पर, बॉट टेक्स्ट जनरेट करते समय कार्ड को रीयल टाइम में अपडेट करता है।

```json5
{
  channels: {
    feishu: {
      streaming: {
        mode: "partial", // स्ट्रीमिंग कार्ड आउटपुट (डिफ़ॉल्ट: "partial")
        block: { enabled: true }, // पूर्ण-ब्लॉक स्ट्रीमिंग के लिए सहमति दें
      },
    },
  },
}
```

पूरा उत्तर एक संदेश में भेजने के लिए `streaming.mode: "off"` सेट करें; `renderMode: "raw"` (कार्ड के बजाय सादा टेक्स्ट) भी स्ट्रीमिंग कार्ड अक्षम करता है। `streaming.block.enabled` डिफ़ॉल्ट रूप से बंद है; इसे केवल तब सक्षम करें जब आप अंतिम उत्तर से पहले पूर्ण हो चुके सहायक ब्लॉक भेजना चाहते हों। लीगेसी बूलियन `streaming` और फ़्लैट `blockStreaming` / `blockStreamingCoalesce` / `chunkMode` कुंजियाँ `openclaw doctor --fix` के माध्यम से इस नेस्टेड संरचना में माइग्रेट होती हैं।

### कोटा अनुकूलन

दो वैकल्पिक फ़्लैग से Feishu/Lark API कॉल की संख्या कम करें:

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

`channels.feishu.groupSessionScope` (शीर्ष स्तर पर, प्रति अकाउंट या प्रति समूह) नियंत्रित करता है कि समूह संदेश एजेंट सत्रों से कैसे मैप होते हैं:

| मान                  | सत्र                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `"group"` (डिफ़ॉल्ट)    | प्रति समूह चैट एक सत्र                                       |
| `"group_sender"`       | प्रति (समूह + प्रेषक) एक सत्र                                 |
| `"group_topic"`        | प्रति विषय थ्रेड एक सत्र; उपलब्ध न होने पर समूह सत्र का उपयोग    |
| `"group_topic_sender"` | प्रति (विषय + प्रेषक) एक सत्र; उपलब्ध न होने पर (समूह + प्रेषक) का उपयोग |

विषय के दायरों के लिए, नेटिव Feishu/Lark विषय समूह इवेंट `thread_id` (`omt_*`) को कैनोनिकल विषय सत्र कुंजी के रूप में उपयोग करते हैं। यदि किसी नेटिव विषय आरंभकर्ता इवेंट में `thread_id` नहीं है, तो OpenClaw टर्न को रूट करने से पहले इसे Feishu से प्राप्त करता है। OpenClaw द्वारा थ्रेड में बदले गए सामान्य समूह उत्तर, उत्तर के रूट संदेश ID (`om_*`) का उपयोग जारी रखते हैं, ताकि पहला टर्न और अनुवर्ती टर्न एक ही सत्र में रहें।

बॉट के उत्तरों को इनलाइन उत्तर देने के बजाय Feishu विषय थ्रेड बनाने या जारी रखने के लिए `replyInThread: "enabled"` (शीर्ष स्तर पर या प्रति समूह) सेट करें। `topicSessionMode`, `groupSessionScope` का अप्रचलित पूर्ववर्ती है; `groupSessionScope` को प्राथमिकता दें।

### Feishu कार्यस्थान टूल

Plugin में Feishu दस्तावेज़ों, चैट, ज्ञानकोश, क्लाउड स्टोरेज, अनुमतियों और Bitable के लिए एजेंट टूल तथा उनसे मेल खाने वाली Skills (`feishu-doc`, `feishu-drive`, `feishu-perm`, `feishu-wiki`) शामिल हैं। टूल परिवारों को `channels.feishu.tools` नियंत्रित करता है:

| कुंजी             | टूल                                         | डिफ़ॉल्ट             |
| --------------- | --------------------------------------------- | ------------------- |
| `tools.doc`     | `feishu_doc` दस्तावेज़ संचालन              | `true`              |
| `tools.chat`    | `feishu_chat` चैट जानकारी + सदस्य क्वेरी      | `true`              |
| `tools.wiki`    | `feishu_wiki` ज्ञानकोश (`doc` आवश्यक) | `true`              |
| `tools.drive`   | `feishu_drive` क्लाउड स्टोरेज                  | `true`              |
| `tools.perm`    | `feishu_perm` अनुमति प्रबंधन           | `false` (संवेदनशील) |
| `tools.scopes`  | `feishu_app_scopes` ऐप दायरा निदान     | `true`              |
| `tools.bitable` | `feishu_bitable_*` Bitable/Base संचालन    | `true`              |

`tools.base`, `tools.bitable` का उपनाम है; दोनों सेट होने पर स्पष्ट `bitable` मान प्रभावी होता है। प्रति-अकाउंट नियंत्रण `accounts.<id>.tools` के अंतर्गत होते हैं।

रूट डायरेक्टरी के बाहर सीधे `feishu_drive info` लुकअप के लिए `drive:drive.metadata:readonly` प्रदान करें, जब तक ऐप के पास पहले से पूर्ण `drive:drive` दायरा न हो। दोनों में से कोई भी दायरा न होने पर, `info`
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

#### चैट से ACP आरंभ करें

Feishu/Lark DM या थ्रेड में:

```text
/acp spawn codex --thread here
```

`--thread here`, DM और Feishu/Lark थ्रेड संदेशों के लिए काम करता है। बाइंड की गई बातचीत के अनुवर्ती संदेश सीधे उस ACP सत्र में रूट होते हैं।

### बहु-एजेंट रूटिंग

Feishu/Lark DM या समूहों को अलग-अलग एजेंटों में रूट करने के लिए `bindings` का उपयोग करें।

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

लुकअप सुझावों के लिए [समूह/उपयोगकर्ता ID प्राप्त करें](#get-groupuser-ids) देखें।

## प्रति-उपयोगकर्ता एजेंट पृथक्करण (डायनेमिक एजेंट निर्माण)

प्रत्येक DM उपयोगकर्ता के लिए स्वचालित रूप से **पृथक एजेंट इंस्टेंस** बनाने हेतु `dynamicAgentCreation` सक्षम करें। प्रत्येक उपयोगकर्ता को अपना यह सब मिलता है:

- स्वतंत्र कार्यस्थान डायरेक्टरी
- अलग `USER.md` / `SOUL.md` / `MEMORY.md`
- निजी बातचीत इतिहास
- पृथक Skills और स्थिति

यह सार्वजनिक बॉट के लिए आवश्यक है, जहाँ आप चाहते हैं कि प्रत्येक उपयोगकर्ता को अपना निजी AI सहायक अनुभव मिले।

<Note>
डायनेमिक बाइंडिंग में सामान्यीकृत Feishu `accountId` शामिल होता है, इसलिए डिफ़ॉल्ट और नामित अकाउंट प्रत्येक प्रेषक को सही डायनेमिक एजेंट में रूट करते हैं।

यदि किसी नामित अकाउंट ने पुराने रिलीज़ में बिना दायरे वाला डायनेमिक एजेंट बनाया था, तो वह लीगेसी एजेंट अब भी `maxAgents` में गिना जाता है। उसे हटाने से पहले पुष्टि करें कि डिफ़ॉल्ट अकाउंट उसका उपयोग नहीं करता, या अस्थायी रूप से `maxAgents` बढ़ाएँ; OpenClaw सुरक्षित रूप से यह निर्धारित नहीं कर सकता कि अस्पष्ट लीगेसी स्थिति का स्वामी कौन-सा अकाउंट है।
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
    // USER.md / SOUL.md / MEMORY.md स्वचालित रूप से लोड करता है
    // अधिक सशक्त पृथक्करण के लिए, इसके बजाय "per-channel-peer" का उपयोग करें
    dmScope: "main",
  },
}
```

### यह कैसे काम करता है

जब कोई नया उपयोगकर्ता अपना पहला DM भेजता है:

1. चैनल एक अद्वितीय `agentId` जनरेट करता है: डिफ़ॉल्ट अकाउंट के लिए `feishu-{user_open_id}`, या नामित अकाउंट के लिए सीमाबद्ध अकाउंट-प्रीफ़िक्स वाला पहचान डाइजेस्ट
2. `workspaceTemplate` पथ पर नया कार्यस्थान बनाता है
3. एजेंट पंजीकृत करता है और इस उपयोगकर्ता के लिए बाइंडिंग बनाता है
4. कार्यस्थान सहायक पहली पहुँच पर बूटस्ट्रैप फ़ाइलें (`AGENTS.md`, `SOUL.md`, `USER.md`, आदि) सुनिश्चित करता है
5. इस उपयोगकर्ता के भविष्य के सभी संदेशों को उसके समर्पित एजेंट में रूट करता है

### कॉन्फ़िगरेशन विकल्प

| सेटिंग                                                  | विवरण                                | डिफ़ॉल्ट                              |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | स्वचालित प्रति-उपयोगकर्ता एजेंट निर्माण सक्षम करें   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | डायनेमिक एजेंट कार्यस्थानों के लिए पथ टेम्पलेट | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | एजेंट डायरेक्टरी नाम का टेम्पलेट              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | बनाए जाने वाले डायनेमिक एजेंटों की अधिकतम संख्या | असीमित                            |

टेम्पलेट वेरिएबल:

- `{agentId}` - जनरेट की गई एजेंट ID (उदाहरण के लिए, `feishu-ou_xxxxxx` या `feishu-support-<identity_digest>`)
- `{userId}` - प्रेषक का Feishu open_id (उदाहरण के लिए, `ou_xxxxxx`)

### सत्र का दायरा

`session.dmScope` नियंत्रित करता है कि सीधे संदेश एजेंट सत्रों से कैसे मैप होते हैं। यह एक **वैश्विक सेटिंग** है, जो सभी चैनलों को प्रभावित करती है।

| मान                        | व्यवहार                                                            | इनके लिए सर्वोत्तम                                                           |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | प्रत्येक उपयोगकर्ता का DM उसके एजेंट के मुख्य सत्र से मैप होता है                   | एकल-उपयोगकर्ता बॉट, जहाँ आप चाहते हैं कि `USER.md` / `SOUL.md` स्वतः लोड हों |
| `"per-peer"`                 | प्रत्येक पीयर को अलग सत्र मिलता है (चैनल की परवाह किए बिना)           | केवल प्रेषक पहचान पर आधारित पृथक्करण                            |
| `"per-channel-peer"`         | प्रत्येक (चैनल + उपयोगकर्ता) संयोजन को अलग सत्र मिलता है           | अधिक सशक्त पृथक्करण की आवश्यकता वाले सार्वजनिक बहु-उपयोगकर्ता बॉट                  |
| `"per-account-channel-peer"` | प्रत्येक (अकाउंट + चैनल + उपयोगकर्ता) संयोजन को अलग सत्र मिलता है | अकाउंट-स्तरीय सत्र पृथक्करण की आवश्यकता वाले बहु-अकाउंट बॉट         |

**समझौता**: `"main"` का उपयोग स्वचालित बूटस्ट्रैप फ़ाइल लोडिंग (`USER.md`, `SOUL.md`, `MEMORY.md`) सक्षम करता है, लेकिन इसका अर्थ है कि सभी चैनलों के सभी DM एक ही सत्र कुंजी पैटर्न साझा करते हैं। सार्वजनिक बहु-उपयोगकर्ता बॉट में, जहाँ पृथक्करण बूटस्ट्रैप के स्वतः लोड होने से अधिक महत्वपूर्ण है, `"per-channel-peer"` पर विचार करें और बूटस्ट्रैप फ़ाइलें मैन्युअल रूप से प्रबंधित करें।

<Note>
जब नामित Feishu अकाउंट को एक ही प्रेषक के लिए अलग सत्र रखने हों, तब `"per-account-channel-peer"` का उपयोग करें। डायनेमिक बाइंडिंग अकाउंट का दायरा बनाए रखती हैं।
</Note>

### सामान्य बहु-उपयोगकर्ता परिनियोजन

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
    // बूटस्ट्रैप स्वतः लोड करने के लिए "main", अधिक सशक्त पृथक्करण के लिए "per-channel-peer"
    dmScope: "main",
  },
  bindings: [], // खाली - डायनेमिक एजेंट स्वतः बाइंड होते हैं
}
```

### सत्यापन

डायनेमिक निर्माण के काम करने की पुष्टि के लिए Gateway लॉग जाँचें:

```text
feishu: उपयोगकर्ता ou_xxxxxx के लिए डायनेमिक एजेंट "feishu-ou_xxxxxx" बनाया जा रहा है
  कार्यस्थान: /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  agentDir: /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

सभी बनाए गए वर्कस्पेस सूचीबद्ध करें:

```bash
ls -la ~/.openclaw/workspace-*
```

### टिप्पणियाँ

- **वर्कस्पेस पृथक्करण**: प्रत्येक उपयोगकर्ता को अपनी वर्कस्पेस डायरेक्टरी और एजेंट इंस्टेंस मिलता है। सामान्य मैसेजिंग प्रवाह में उपयोगकर्ता एक-दूसरे का वार्तालाप इतिहास या फ़ाइलें नहीं देख सकते।
- **सुरक्षा सीमा**: यह मैसेजिंग-संदर्भ पृथक्करण तंत्र है, दुर्भावनापूर्ण सह-किरायेदारों के विरुद्ध सुरक्षा सीमा नहीं। एजेंट प्रक्रिया और होस्ट परिवेश साझा होते हैं।
- **कॉन्फ़िगरेशन लेखन सक्षम रहना चाहिए**: डायनेमिक एजेंट निर्माण एजेंट और बाइंडिंग को कॉन्फ़िगरेशन में लिखता है; जब `channels.feishu.configWrites` का मान `false` होता है, तो इसे छोड़ दिया जाता है (डिफ़ॉल्ट: सक्षम)।
- **`bindings` खाली होना चाहिए**: डायनेमिक एजेंट अपनी बाइंडिंग स्वयं पंजीकृत करते हैं
- **अपग्रेड पथ**: मौजूदा मैन्युअल बाइंडिंग डायनेमिक एजेंट के साथ काम करती रहती हैं
- **`session.dmScope` वैश्विक है**: यह केवल Feishu ही नहीं, सभी चैनलों को प्रभावित करता है

## कॉन्फ़िगरेशन संदर्भ

पूर्ण कॉन्फ़िगरेशन: [Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration)

| सेटिंग                                                  | विवरण                                                                          | डिफ़ॉल्ट                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | चैनल सक्षम/अक्षम करें                                                           | `true`                               |
| `channels.feishu.domain`                                 | API डोमेन (`feishu`, `lark`, या कोई `https://` आधार URL)                             | `feishu`                             |
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
| `channels.feishu.requireMention`                         | समूहों में @उल्लेख आवश्यक करें                                                           | `true` (जब नीति `open` हो, तब `false`)  |
| `channels.feishu.allowBots`                              | बॉट-लूप सुरक्षा के साथ इस बॉट का उल्लेख करने वाले अन्य बॉट स्वीकार करें                    | `false`                              |
| `channels.feishu.groups.<chat_id>.requireMention`        | प्रति-समूह @उल्लेख ओवरराइड; स्पष्ट ID अनुमति-सूची मोड में समूह को भी स्वीकार करते हैं     | इनहेरिट किया हुआ                            |
| `channels.feishu.groups.<chat_id>.enabled`               | किसी विशिष्ट समूह को सक्षम/अक्षम करें                                                      | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | प्रति-समूह प्रेषक अनुमति-सूची (`groupSenderAllowFrom` को ओवरराइड करती है)                        | -                                    |
| `channels.feishu.groupSessionScope`                      | समूह सत्र मैपिंग (`group`, `group_sender`, `group_topic`, `group_topic_sender`) | `group`                              |
| `channels.feishu.replyInThread`                          | बॉट के उत्तर विषय थ्रेड बनाते/जारी रखते हैं (`disabled`, `enabled`)                    | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | इनबाउंड प्रतिक्रिया इवेंट (`off`, `own`, `all`)                                        | `own`                                |
| `channels.feishu.vcAutoJoin`                             | सामान्य DM प्राधिकरण के बाद आमंत्रित VC मीटिंग में शामिल हों                               | `false`                              |
| `channels.feishu.dynamicAgentCreation.enabled`           | स्वचालित प्रति-उपयोगकर्ता एजेंट निर्माण सक्षम करें                                             | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | डायनेमिक एजेंट वर्कस्पेस के लिए पथ टेम्पलेट                                           | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | एजेंट डायरेक्टरी नाम टेम्पलेट                                                        | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | बनाए जाने वाले डायनेमिक एजेंट की अधिकतम संख्या                                           | असीमित                            |
| `channels.feishu.textChunkLimit`                         | संदेश खंड का आकार                                                                   | `4000`                               |
| `channels.feishu.streaming.chunkMode`                    | खंड विभाजन (`length` या `newline`)                                              | `length`                             |
| `channels.feishu.mediaMaxMb`                             | मीडिया आकार सीमा                                                                     | `30`                                 |
| `channels.feishu.renderMode`                             | उत्तर रेंडरिंग (`auto`, `raw`, `card`)                                              | `auto`                               |
| `channels.feishu.streaming.mode`                         | स्ट्रीमिंग कार्ड आउटपुट (`partial` या `off`)                                           | `partial`                            |
| `channels.feishu.streaming.block.enabled`                | पूर्ण हो चुके ब्लॉक के उत्तर की स्ट्रीमिंग                                                      | `false`                              |
| `channels.feishu.typingIndicator`                        | टाइपिंग प्रतिक्रियाएँ भेजें                                                                | `true`                               |
| `channels.feishu.resolveSenderNames`                     | प्रेषक के प्रदर्शन नाम निर्धारित करें                                                         | `true`                               |
| `channels.feishu.configWrites`                           | चैनल द्वारा आरंभ किए गए कॉन्फ़िगरेशन लेखन की अनुमति दें (डायनेमिक एजेंट के लिए आवश्यक)                     | `true`                               |
| `channels.feishu.tools.doc`                              | दस्तावेज़ टूल सक्षम करें                                                                | `true`                               |
| `channels.feishu.tools.chat`                             | चैट जानकारी टूल सक्षम करें                                                               | `true`                               |
| `channels.feishu.tools.wiki`                             | नॉलेज बेस टूल सक्षम करें (`doc` आवश्यक है)                                         | `true`                               |
| `channels.feishu.tools.drive`                            | क्लाउड स्टोरेज टूल सक्षम करें                                                           | `true`                               |
| `channels.feishu.tools.perm`                             | अनुमति प्रबंधन टूल सक्षम करें                                                   | `false`                              |
| `channels.feishu.tools.scopes`                           | ऐप स्कोप डायग्नोस्टिक टूल सक्षम करें                                                    | `true`                               |
| `channels.feishu.tools.bitable`                          | Bitable/Base टूल सक्षम करें                                                            | `true`                               |
| `channels.feishu.tools.base`                             | `channels.feishu.tools.bitable` का उपनाम; दोनों सेट होने पर स्पष्ट `bitable` प्रभावी होता है     | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | प्रति-खाता Bitable/Base टूल गेट                                                   | इनहेरिट किया हुआ                            |
| `channels.feishu.accounts.<id>.tools.base`               | `tools.bitable` का प्रति-खाता उपनाम                                                | इनहेरिट किया हुआ                            |

## समर्थित संदेश प्रकार

### प्राप्त करना

- ✅ टेक्स्ट
- ✅ रिच टेक्स्ट (पोस्ट)
- ✅ छवियाँ
- ✅ फ़ाइलें
- ✅ ऑडियो
- ✅ वीडियो/मीडिया
- ✅ स्टिकर

इनबाउंड Feishu/Lark ऑडियो संदेशों को कच्चे `file_key` JSON के बजाय
मीडिया प्लेसहोल्डर के रूप में सामान्यीकृत किया जाता है। जब `tools.media.audio` कॉन्फ़िगर किया जाता है, तब OpenClaw
वॉइस-नोट संसाधन डाउनलोड करता है और एजेंट टर्न से पहले साझा ऑडियो ट्रांसक्रिप्शन चलाता है,
जिससे एजेंट को बोली गई सामग्री का ट्रांसक्रिप्ट प्राप्त होता है। यदि Feishu ऑडियो पेलोड में
सीधे ट्रांसक्रिप्ट टेक्स्ट शामिल करता है, तो उस टेक्स्ट का उपयोग किसी अन्य
ASR कॉल के बिना किया जाता है। ऑडियो ट्रांसक्रिप्शन प्रदाता के बिना भी एजेंट को
सहेजे गए अटैचमेंट के साथ `<media:audio>` प्लेसहोल्डर मिलता है, कच्चा Feishu
संसाधन पेलोड नहीं।

### भेजना

- ✅ टेक्स्ट
- ✅ छवियाँ
- ✅ फ़ाइलें
- ✅ ऑडियो
- ✅ वीडियो/मीडिया
- ✅ इंटरैक्टिव कार्ड (स्ट्रीमिंग अपडेट सहित)
- ⚠️ रिच टेक्स्ट (पोस्ट-शैली फ़ॉर्मेटिंग; पूर्ण Feishu/Lark लेखन क्षमताओं का समर्थन नहीं करता)

मूल Feishu/Lark ऑडियो बबल Feishu `audio` संदेश प्रकार का उपयोग करते हैं और उनके लिए
Ogg/Opus अपलोड मीडिया (`file_type: "opus"`) आवश्यक है। मौजूदा `.opus` और `.ogg` मीडिया
सीधे मूल ऑडियो के रूप में भेजा जाता है। MP3/WAV/M4A और अन्य संभावित ऑडियो प्रारूपों को
`ffmpeg` के साथ 48kHz Ogg/Opus में केवल तभी ट्रांसकोड किया जाता है, जब उत्तर में वॉइस
डिलीवरी का अनुरोध किया गया हो (`audioAsVoice` / संदेश टूल `asVoice`, जिसमें TTS वॉइस-नोट
उत्तर शामिल हैं)। सामान्य MP3 अटैचमेंट नियमित फ़ाइलें ही रहते हैं। यदि `ffmpeg` उपलब्ध नहीं है या
रूपांतरण विफल हो जाता है, तो OpenClaw फ़ाइल अटैचमेंट का उपयोग करता है और कारण लॉग करता है।

### थ्रेड और उत्तर

- ✅ इनलाइन उत्तर
- ✅ थ्रेड उत्तर
- ✅ किसी थ्रेड संदेश का उत्तर देते समय मीडिया उत्तर थ्रेड-संदर्भ बनाए रखते हैं

विषय-समूह सेशन रूटिंग की जानकारी
[समूह सेशन का दायरा और विषय थ्रेड](#group-session-scope-and-topic-threads) में दी गई है।

## संबंधित

- [चैनल का अवलोकन](/hi/channels) - सभी समर्थित चैनल
- [पेयरिंग](/hi/channels/pairing) - DM प्रमाणीकरण और पेयरिंग प्रवाह
- [समूह](/hi/channels/groups) - समूह चैट का व्यवहार और उल्लेख गेटिंग
- [चैनल रूटिंग](/hi/channels/channel-routing) - संदेशों के लिए सेशन रूटिंग
- [सुरक्षा](/hi/gateway/security) - एक्सेस मॉडल और सुदृढ़ीकरण
