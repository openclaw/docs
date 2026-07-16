---
read_when:
    - आप एक Yuanbao बॉट कनेक्ट करना चाहते हैं
    - आप Yuanbao चैनल कॉन्फ़िगर कर रहे हैं
summary: Yuanbao बॉट का अवलोकन, सुविधाएँ और कॉन्फ़िगरेशन
title: युआनबाओ
x-i18n:
    generated_at: "2026-07-16T13:38:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 43488834f588530206b290cb0fb185fd1fe2e1f214ab4a4ccccc49b9b549b6ac
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao, Tencent का AI सहायक प्लेटफ़ॉर्म है। समुदाय द्वारा अनुरक्षित `openclaw-plugin-yuanbao` plugin सीधे संदेशों और समूह चैट के लिए Yuanbao बॉट्स को WebSocket के माध्यम से OpenClaw से जोड़ता है।

**स्थिति:** बॉट के सीधे संदेशों और समूह चैट के लिए उत्पादन हेतु तैयार। WebSocket एकमात्र समर्थित कनेक्शन मोड है। यह plugin, मुख्य OpenClaw द्वारा नहीं, बल्कि Tencent Yuanbao टीम द्वारा बाहरी कैटलॉग प्रविष्टि के रूप में अनुरक्षित है; नीचे दिए गए कॉन्फ़िगरेशन/व्यवहार के विवरण (इंस्टॉलेशन और सामान्य CLI सतह के अतिरिक्त) plugin के अपने दस्तावेज़ों से लिए गए हैं और OpenClaw के मुख्य स्रोत के विरुद्ध सत्यापित नहीं हैं।

## त्वरित शुरुआत

OpenClaw 2026.4.10 या इसके बाद का संस्करण आवश्यक है। `openclaw --version` से जाँचें; `openclaw update` से अपग्रेड करें।

<Steps>
  <Step title="अपने क्रेडेंशियल के साथ Yuanbao चैनल जोड़ें">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` कोलन से अलग किए गए `appKey:appSecret` का उपयोग करता है। अपने एप्लिकेशन की सेटिंग में बॉट बनाकर इन्हें Yuanbao ऐप से प्राप्त करें।
  </Step>

  <Step title="परिवर्तन लागू करने के लिए Gateway पुनः आरंभ करें">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### इंटरैक्टिव सेटअप (वैकल्पिक)

```bash
openclaw channels login --channel yuanbao
```

अपना App ID और App Secret दर्ज करने के लिए संकेतों का पालन करें।

## अभिगम नियंत्रण

### सीधे संदेश

`channels.yuanbao.dm.policy`:

| मान            | व्यवहार                                          |
| ---------------- | ------------------------------------------------- |
| `open` (डिफ़ॉल्ट) | सभी उपयोगकर्ताओं को अनुमति दें                                   |
| `pairing`        | अज्ञात उपयोगकर्ताओं को पेयरिंग कोड मिलता है; CLI के माध्यम से स्वीकृति दें |
| `allowlist`      | केवल `allowFrom` में शामिल उपयोगकर्ता चैट कर सकते हैं                |
| `disabled`       | सभी सीधे संदेश अक्षम करें                                   |

पेयरिंग अनुरोध को स्वीकृति दें:

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### समूह चैट

`channels.yuanbao.requireMention` (डिफ़ॉल्ट `true`): समूह में बॉट के उत्तर देने से पहले @mention आवश्यक है। बॉट के अपने संदेश का उत्तर देना अप्रत्यक्ष उल्लेख माना जाता है।

## कॉन्फ़िगरेशन के उदाहरण

मूल सेटअप, खुली सीधे-संदेश नीति:

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

सीधे संदेशों को विशिष्ट उपयोगकर्ताओं तक सीमित करें:

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

समूहों में @mention की आवश्यकता अक्षम करें:

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

आउटबाउंड डिलीवरी समायोजन:

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // इतने वर्ण होने तक बफ़र करें
      maxChars: 3000, // इस सीमा से ऊपर अनिवार्य रूप से विभाजित करें
      idleMs: 5000, // निष्क्रियता समय-सीमा (ms) के बाद स्वतः फ़्लश करें
    },
  },
}
```

प्रत्येक खंड को बफ़र किए बिना भेजने के लिए `outboundQueueStrategy: "immediate"` सेट करें।

## सामान्य कमांड

| कमांड    | विवरण                 |
| ---------- | --------------------------- |
| `/help`    | उपलब्ध कमांड दिखाएँ     |
| `/status`  | बॉट की स्थिति दिखाएँ             |
| `/new`     | नया सत्र शुरू करें         |
| `/stop`    | वर्तमान रन रोकें        |
| `/restart` | OpenClaw पुनः आरंभ करें            |
| `/compact` | सत्र संदर्भ को संक्षिप्त करें |

Yuanbao मूल स्लैश-कमांड मेनू का समर्थन करता है; Gateway आरंभ होने पर कमांड प्लेटफ़ॉर्म से स्वचालित रूप से सिंक हो जाते हैं।

## समस्या निवारण

**बॉट समूह चैट में उत्तर नहीं देता:**

1. पुष्टि करें कि बॉट समूह में जोड़ा गया है
2. पुष्टि करें कि आपने बॉट को @mention किया है (डिफ़ॉल्ट रूप से आवश्यक)
3. लॉग जाँचें: `openclaw logs --follow`

**बॉट को संदेश प्राप्त नहीं होते:**

1. पुष्टि करें कि Yuanbao ऐप में बॉट बनाया और स्वीकृत किया गया है
2. पुष्टि करें कि `appKey` और `appSecret` सही ढंग से कॉन्फ़िगर हैं
3. पुष्टि करें कि Gateway चल रहा है: `openclaw gateway status`
4. लॉग जाँचें: `openclaw logs --follow`

**बॉट खाली या फ़ॉलबैक उत्तर भेजता है:**

1. जाँचें कि AI मॉडल मान्य सामग्री लौटा रहा है या नहीं
2. डिफ़ॉल्ट फ़ॉलबैक उत्तर: "暂时无法解答，你可以换个问题问问我哦"
3. `channels.yuanbao.fallbackReply` से अनुकूलित करें

**App Secret लीक हो गया:**

1. Yuanbao ऐप में App Secret रीसेट करें
2. अपने कॉन्फ़िगरेशन में मान अपडेट करें
3. Gateway पुनः आरंभ करें: `openclaw gateway restart`

## उन्नत कॉन्फ़िगरेशन

### एकाधिक खाते

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "प्राथमिक बॉट",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
          name: "बैकअप बॉट",
          enabled: false,
        },
      },
    },
  },
}
```

जब आउटबाउंड API किसी `accountId` को निर्दिष्ट नहीं करते, तब `defaultAccount` नियंत्रित करता है कि कौन-सा खाता उपयोग किया जाए।

### संदेश सीमाएँ

- `maxChars`: एक संदेश में वर्णों की अधिकतम संख्या (डिफ़ॉल्ट `3000`)
- `mediaMaxMb`: मीडिया अपलोड/डाउनलोड सीमा (डिफ़ॉल्ट `20` MB)
- `overflowPolicy`: संदेश के सीमा पार करने पर व्यवहार, `"split"` (डिफ़ॉल्ट) या `"stop"`

### स्ट्रीमिंग

Yuanbao ब्लॉक-स्तरीय स्ट्रीमिंग आउटपुट का समर्थन करता है; बॉट टेक्स्ट उत्पन्न करते समय उसे खंडों में भेजता है।

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // ब्लॉक स्ट्रीमिंग सक्षम है (डिफ़ॉल्ट)
    },
  },
}
```

पूरा उत्तर एक संदेश में भेजने के लिए `disableBlockStreaming: true` सेट करें।

### समूह चैट इतिहास संदर्भ

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // डिफ़ॉल्ट: 100, अक्षम करने के लिए 0 सेट करें
    },
  },
}
```

यह नियंत्रित करता है कि समूह चैट के AI संदर्भ में कितने ऐतिहासिक संदेश शामिल किए जाएँ।

### उत्तर-संदर्भ मोड

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (डिफ़ॉल्ट: "first")
    },
  },
}
```

| मान   | व्यवहार                                                 |
| ------- | -------------------------------------------------------- |
| `off`   | कोई उद्धृत उत्तर नहीं                                           |
| `first` | प्रत्येक इनबाउंड संदेश के केवल पहले उत्तर को उद्धृत करें (डिफ़ॉल्ट) |
| `all`   | प्रत्येक उत्तर को उद्धृत करें                                        |

### Markdown संकेत अंतःक्षेपण

डिफ़ॉल्ट रूप से, बॉट मॉडल को पूरे उत्तर को markdown कोड ब्लॉक में लपेटने से रोकने के लिए सिस्टम-प्रॉम्प्ट निर्देश अंतःक्षेपित करता है।

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // डिफ़ॉल्ट: true
    },
  },
}
```

### डीबग मोड

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

सूचीबद्ध बॉट ID के लिए अस्वच्छीकृत लॉग आउटपुट सक्षम करता है।

### बहु-एजेंट रूटिंग

Yuanbao के सीधे संदेशों या समूहों को अलग-अलग एजेंटों तक रूट करने के लिए `bindings` का उपयोग करें:

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

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (सीधा संदेश) या `"group"` (समूह चैट)
- `match.peer.id`: उपयोगकर्ता ID या समूह कोड

## कॉन्फ़िगरेशन संदर्भ

पूरा कॉन्फ़िगरेशन: [Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration)

| सेटिंग                                    | विवरण                                       | डिफ़ॉल्ट                                |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | चैनल सक्षम/अक्षम करें                        | `true`                                 |
| `channels.yuanbao.defaultAccount`          | आउटबाउंड रूटिंग के लिए डिफ़ॉल्ट खाता              | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (हस्ताक्षर + टिकट निर्माण)             | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (हस्ताक्षर)                              | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | पूर्व-हस्ताक्षरित टोकन (स्वचालित टिकट हस्ताक्षर छोड़ देता है) | -                                      |
| `channels.yuanbao.accounts.<id>.name`      | खाते का प्रदर्शन नाम                              | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | किसी विशिष्ट खाते को सक्षम/अक्षम करें                 | `true`                                 |
| `channels.yuanbao.dm.policy`               | सीधे संदेश की नीति                                         | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | सीधे संदेश की अनुमति-सूची (उपयोगकर्ता ID सूची)                       | -                                      |
| `channels.yuanbao.requireMention`          | समूहों में @mention आवश्यक करें                        | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | लंबे संदेश का प्रबंधन (`split` या `stop`)         | `split`                                |
| `channels.yuanbao.replyToMode`             | समूह उत्तर-संदर्भ रणनीति (`off`, `first`, `all`)   | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | आउटबाउंड रणनीति (`merge-text` या `immediate`)   | `merge-text`                           |
| `channels.yuanbao.minChars`                | मर्ज-टेक्स्ट: भेजना शुरू करने के लिए न्यूनतम वर्ण             | `2800`                                 |
| `channels.yuanbao.maxChars`                | मर्ज-टेक्स्ट: प्रति संदेश अधिकतम वर्ण                 | `3000`                                 |
| `channels.yuanbao.idleMs`                  | मर्ज-टेक्स्ट: स्वतः फ़्लश से पहले निष्क्रियता समय-सीमा (ms)   | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | मीडिया आकार सीमा (MB)                             | `20`                                   |
| `channels.yuanbao.historyLimit`            | समूह चैट इतिहास संदर्भ प्रविष्टियाँ                | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | ब्लॉक-स्तरीय स्ट्रीमिंग आउटपुट अक्षम करें              | `false`                                |
| `channels.yuanbao.fallbackReply`           | मॉडल द्वारा कोई सामग्री न लौटाए जाने पर फ़ॉलबैक उत्तर  | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | markdown को लपेटने से रोकने वाले निर्देश अंतःक्षेपित करें        | `true`                                 |
| `channels.yuanbao.debugBotIds`             | डीबग अनुमति-सूची के बॉट ID (अस्वच्छीकृत लॉग)        | `[]`                                   |

## समर्थित संदेश प्रकार

**प्राप्त करें:** टेक्स्ट, चित्र, फ़ाइलें, ऑडियो/ध्वनि, वीडियो, स्टिकर/कस्टम इमोजी, कस्टम तत्व (लिंक कार्ड)।

**भेजें:** टेक्स्ट (markdown), चित्र, फ़ाइलें, ऑडियो, वीडियो, स्टिकर।

**थ्रेड और उत्तर:** उद्धृत उत्तर (`replyToMode` के माध्यम से कॉन्फ़िगर करने योग्य); थ्रेड उत्तर प्लेटफ़ॉर्म द्वारा समर्थित नहीं हैं।

## संबंधित

- [चैनलों का अवलोकन](/hi/channels) - सभी समर्थित चैनल
- [पेयरिंग](/hi/channels/pairing) - DM प्रमाणीकरण और पेयरिंग प्रवाह
- [समूह](/hi/channels/groups) - समूह चैट का व्यवहार और उल्लेख नियंत्रण
- [चैनल रूटिंग](/hi/channels/channel-routing) - संदेशों के लिए सत्र रूटिंग
- [सुरक्षा](/hi/gateway/security) - अभिगम मॉडल और सुदृढ़ीकरण
