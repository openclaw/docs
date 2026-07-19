---
read_when:
    - Signal समर्थन सेट अप करना
    - Signal पर संदेश भेजने/प्राप्त करने की डीबगिंग
summary: signal-cli (नेटिव डेमन या bbernhard कंटेनर) के माध्यम से Signal समर्थन, सेटअप पथ और नंबर मॉडल
title: Signal
x-i18n:
    generated_at: "2026-07-19T08:01:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0bbae246e797f79e68b1b217006450b557021a5587467975b79840672ac34d75
    source_path: channels/signal.md
    workflow: 16
---

Signal एक डाउनलोड करने योग्य चैनल Plugin है (`@openclaw/signal`)। Gateway, HTTP पर `signal-cli` से संचार करता है: या तो नेटिव डेमन (JSON-RPC + SSE) या [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) कंटेनर (REST + WebSocket)। OpenClaw में libsignal एम्बेड नहीं है।

## नंबर मॉडल (इसे पहले पढ़ें)

- Gateway एक **Signal डिवाइस** से कनेक्ट होता है: `signal-cli` खाता।
- बॉट को **आपके व्यक्तिगत Signal खाते** पर चलाने से वह आपके अपने संदेशों को अनदेखा करता है (लूप सुरक्षा)।
- “मैं बॉट को संदेश भेजूँ और वह उत्तर दे” के लिए, एक **अलग बॉट नंबर** का उपयोग करें।

## इंस्टॉल करें

```bash
openclaw plugins install @openclaw/signal
```

बिना स्रोत वाले Plugin विनिर्देश पहले ClawHub आज़माते हैं, फिर npm फ़ॉलबैक। `openclaw plugins install clawhub:@openclaw/signal` या `npm:@openclaw/signal` से स्रोत को बाध्य करें। `plugins install` Plugin को पंजीकृत और सक्षम करता है; अलग `enable` चरण की आवश्यकता नहीं है। सामान्य इंस्टॉल नियमों के लिए [Plugins](/hi/tools/plugin) देखें।

## त्वरित सेटअप

<Steps>
  <Step title="एक नंबर चुनें">
    बॉट के लिए **अलग Signal नंबर** का उपयोग करें (अनुशंसित)।
  </Step>
  <Step title="Plugin इंस्टॉल करें">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="निर्देशित सेटअप चलाएँ">
    ```bash
    openclaw channels add
    ```
    विज़ार्ड पता लगाता है कि `signal-cli`, `PATH` पर उपलब्ध है या नहीं और उपलब्ध न होने पर उसे इंस्टॉल करने की पेशकश करता है: Linux x86-64 पर आधिकारिक नेटिव GraalVM बिल्ड डाउनलोड करता है, या macOS और अन्य आर्किटेक्चर पर Homebrew के माध्यम से इंस्टॉल करता है। इसके बाद वह बॉट नंबर और `signal-cli` पथ पूछता है।

    गैर-इंटरैक्टिव सेटअप के लिए, `openclaw channels add --channel signal` बॉट फ़ोन नंबर हेतु `--signal-number <e164>`, और Signal डेमन एंडपॉइंट हेतु `--http-host <host>` तथा `--http-port <port>` भी स्वीकार करता है (डिफ़ॉल्ट `127.0.0.1:8080`)।

  </Step>
  <Step title="खाता लिंक या पंजीकृत करें">
    - **QR लिंक (सबसे तेज़):** `signal-cli link -n "OpenClaw"`, फिर Signal से स्कैन करें। [पथ A](#setup-path-a-link-existing-signal-account-qr) देखें।
    - **SMS पंजीकरण:** कैप्चा + SMS सत्यापन वाला समर्पित नंबर। [पथ B](#setup-path-b-register-dedicated-bot-number-sms-linux) देखें।

  </Step>
  <Step title="सत्यापित और पेयर करें">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    पहला DM भेजें और पेयरिंग स्वीकृत करें: `openclaw pairing approve signal <CODE>`।
  </Step>
</Steps>

न्यूनतम कॉन्फ़िगरेशन:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

| फ़ील्ड        | विवरण                                       |
| ------------ | ------------------------------------------------- |
| `account`    | E.164 प्रारूप में बॉट फ़ोन नंबर (`+15551234567`) |
| `cliPath`    | `signal-cli` का पथ (`signal-cli`, यदि `PATH` पर हो)  |
| `configPath` | `--config` के रूप में दिया गया signal-cli कॉन्फ़िगरेशन डिर |
| `dmPolicy`   | DM पहुँच नीति (`pairing` अनुशंसित)          |
| `allowFrom`  | DM भेजने की अनुमति वाले फ़ोन नंबर या `uuid:<id>` मान |

बहु-खाता समर्थन: प्रति-खाता कॉन्फ़िगरेशन और वैकल्पिक `name` के साथ `channels.signal.accounts` का उपयोग करें। साझा पैटर्न के लिए [बहु-खाता चैनल](/hi/gateway/config-channels#multi-account-all-channels) देखें।

## यह क्या है

- नियतात्मक रूटिंग: उत्तर हमेशा Signal पर वापस जाते हैं।
- DM, एजेंट के मुख्य सत्र को साझा करते हैं; समूह अलग-थलग रहते हैं (`agent:<agentId>:signal:group:<groupId>`)।
- डिफ़ॉल्ट रूप से, Signal `/config set|unset` द्वारा ट्रिगर किए गए कॉन्फ़िगरेशन अपडेट लिख सकता है (`commands.config: true` आवश्यक)। `channels.signal.configWrites: false` से अक्षम करें।

## सेटअप पथ A: मौजूदा Signal खाता लिंक करें (QR)

1. `signal-cli` (JVM या नेटिव बिल्ड) इंस्टॉल करें, या `openclaw channels add` को इसे आपके लिए इंस्टॉल करने दें।
2. बॉट खाता लिंक करें: `signal-cli link -n "OpenClaw"`, फिर Signal में QR स्कैन करें।
3. Signal कॉन्फ़िगर करें और Gateway शुरू करें।

## सेटअप पथ B: समर्पित बॉट नंबर पंजीकृत करें (SMS, Linux)

मौजूदा Signal ऐप खाते को लिंक करने के बजाय समर्पित बॉट नंबर के लिए इसका उपयोग करें। नीचे दिए गए प्रवाह का Ubuntu 24 पर परीक्षण किया गया है।

1. ऐसा नंबर प्राप्त करें जो SMS प्राप्त कर सके (या लैंडलाइन के लिए वॉइस सत्यापन)। समर्पित बॉट नंबर खाता/सत्र टकरावों से बचाता है।
2. Gateway होस्ट पर `signal-cli` इंस्टॉल करें:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

यदि आप JVM बिल्ड (`signal-cli-${VERSION}.tar.gz`) का उपयोग करते हैं, तो पहले JRE इंस्टॉल करें। `signal-cli` को अपडेट रखें; अपस्ट्रीम के अनुसार Signal सर्वर API बदलने पर पुराने रिलीज़ काम करना बंद कर सकते हैं।

3. नंबर पंजीकृत और सत्यापित करें:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

यदि कैप्चा आवश्यक हो (इस चरण को पूरा करने के लिए ब्राउज़र पहुँच आवश्यक है):

1. `https://signalcaptchas.org/registration/generate.html` खोलें।
2. कैप्चा पूरा करें, “Open Signal” से `signalcaptcha://...` लिंक लक्ष्य कॉपी करें।
3. जब संभव हो, ब्राउज़र सत्र के समान बाहरी IP से चलाएँ (कैप्चा टोकन जल्दी समाप्त हो जाते हैं)।
4. तुरंत पंजीकृत और सत्यापित करें:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw कॉन्फ़िगर करें, Gateway पुनः आरंभ करें और चैनल सत्यापित करें:

```bash
# यदि आप Gateway को उपयोगकर्ता systemd सेवा के रूप में चलाते हैं:
systemctl --user restart openclaw-gateway.service

# फिर सत्यापित करें:
openclaw doctor
openclaw channels status --probe
```

5. अपने DM प्रेषक को पेयर करें:
   - बॉट नंबर पर कोई भी संदेश भेजें।
   - सर्वर पर स्वीकृत करें: `openclaw pairing approve signal <PAIRING_CODE>`।
   - “Unknown contact” से बचने के लिए बॉट नंबर को अपने फ़ोन में संपर्क के रूप में सहेजें।

<Warning>
`signal-cli` के साथ फ़ोन नंबर खाता पंजीकृत करने से उस नंबर के मुख्य Signal ऐप सत्र का प्रमाणीकरण रद्द हो सकता है। समर्पित बॉट नंबर को प्राथमिकता दें, या अपने मौजूदा फ़ोन ऐप सेटअप को बनाए रखने के लिए QR लिंक मोड का उपयोग करें।
</Warning>

अपस्ट्रीम संदर्भ:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- कैप्चा प्रवाह: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- लिंकिंग प्रवाह: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## बाहरी डेमन मोड (httpUrl)

`signal-cli` को स्वयं प्रबंधित करने के लिए (धीमे JVM कोल्ड स्टार्ट, कंटेनर आरंभीकरण, साझा CPU), डेमन को अलग से चलाएँ और OpenClaw को उसकी ओर इंगित करें:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

यह स्वतः स्पॉन और OpenClaw की स्टार्टअप प्रतीक्षा को छोड़ देता है। धीमे स्वतः स्पॉन किए गए स्टार्ट के लिए, `channels.signal.startupTimeoutMs` सेट करें।

## कंटेनर मोड (bbernhard/signal-cli-rest-api)

`signal-cli` को नेटिव रूप से चलाने के बजाय, [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker कंटेनर का उपयोग करें, जो `signal-cli` को REST + WebSocket इंटरफ़ेस के पीछे रैप करता है।

आवश्यकताएँ:

- रीयल-टाइम संदेश प्राप्ति के लिए कंटेनर को `MODE=json-rpc` के साथ चलना **अनिवार्य** है।
- OpenClaw कनेक्ट करने से पहले कंटेनर के अंदर अपना Signal खाता पंजीकृत या लिंक करें।

उदाहरण `docker-compose.yml` सेवा:

```yaml
signal-cli:
  image: bbernhard/signal-cli-rest-api:latest
  environment:
    MODE: json-rpc
  ports:
    - "8080:8080"
  volumes:
    - signal-cli-data:/home/.local/share/signal-cli
```

OpenClaw कॉन्फ़िगरेशन:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // या स्वतः पता लगाने के लिए "auto"
    },
  },
}
```

`apiMode` नियंत्रित करता है कि OpenClaw किस प्रोटोकॉल का उपयोग करता है:

| मान         | व्यवहार                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (डिफ़ॉल्ट) दोनों ट्रांसपोर्ट की जाँच करता है; स्ट्रीमिंग कंटेनर WebSocket प्राप्ति को सत्यापित करती है    |
| `"native"`    | नेटिव signal-cli को बाध्य करें (`/api/v1/rpc` पर JSON-RPC, `/api/v1/events` पर SSE)         |
| `"container"` | bbernhard कंटेनर को बाध्य करें (`/v2/send` पर REST, `/v1/receive/{account}` पर WebSocket) |

जब `apiMode`, `"auto"` हो, तो बार-बार जाँच से बचने के लिए OpenClaw पता लगाए गए मोड को प्रति डेमन URL 30 सेकंड तक कैश करता है (जब दोनों ट्रांसपोर्ट स्वस्थ हों तो नेटिव को प्राथमिकता मिलती है)। स्ट्रीमिंग के लिए कंटेनर प्राप्ति तभी चुनी जाती है जब `/v1/receive/{account}`, WebSocket में अपग्रेड हो जाता है, जिसके लिए `MODE=json-rpc` आवश्यक है।

जहाँ कंटेनर मेल खाने वाले API उपलब्ध कराता है, वहाँ कंटेनर मोड नेटिव मोड के समान Signal कार्रवाइयों का समर्थन करता है: भेजना, प्राप्त करना, अटैचमेंट, टाइपिंग संकेतक, पढ़े/देखे जाने की रसीदें, प्रतिक्रियाएँ, समूह और शैलीबद्ध टेक्स्ट। OpenClaw नेटिव Signal RPC कॉल को कंटेनर के REST पेलोड में रूपांतरित करता है, जिसमें फ़ॉर्मैट किए गए टेक्स्ट के लिए `group.{base64(internal_id)}` समूह ID और `text_mode: "styled"` शामिल हैं।

संचालन संबंधी टिप्पणियाँ:

- कंटेनर मोड के साथ `autoStart: false` का उपयोग करें; `apiMode: "container"` चुने जाने पर OpenClaw को नेटिव डेमन स्पॉन नहीं करना चाहिए।
- प्राप्ति के लिए `MODE=json-rpc` का उपयोग करें। `MODE=normal`, `/v1/about` को स्वस्थ दिखा सकता है, लेकिन `/v1/receive/{account}` WebSocket में अपग्रेड नहीं होगा, इसलिए OpenClaw `auto` मोड में कंटेनर प्राप्ति स्ट्रीमिंग नहीं चुनेगा।
- जब `httpUrl`, bbernhard REST API की ओर इंगित करे तो `apiMode: "container"`; जब वह नेटिव `signal-cli` JSON-RPC/SSE की ओर इंगित करे तो `"native"`; और जब परिनियोजन बदल सकता हो तो `"auto"` सेट करें।
- कंटेनर अटैचमेंट डाउनलोड, नेटिव मोड जैसी ही मीडिया बाइट सीमाओं का पालन करते हैं। जब सर्वर `Content-Length` भेजता है, तो अत्यधिक बड़े प्रत्युत्तर पूर्ण रूप से बफ़र होने से पहले अस्वीकार कर दिए जाते हैं, और अन्यथा स्ट्रीमिंग के दौरान अस्वीकार होते हैं।

## पहुँच नियंत्रण (DM + समूह)

DM:

- डिफ़ॉल्ट: `channels.signal.dmPolicy = "pairing"`।
- अज्ञात प्रेषकों को पेयरिंग कोड मिलता है; स्वीकृत होने तक संदेशों को अनदेखा किया जाता है (कोड 1 घंटे बाद समाप्त हो जाते हैं)।
- `openclaw pairing list signal` और `openclaw pairing approve signal <CODE>` के माध्यम से स्वीकृत करें।
- Signal DM के लिए पेयरिंग डिफ़ॉल्ट टोकन विनिमय है। विवरण: [पेयरिंग](/hi/channels/pairing)
- केवल-UUID प्रेषक (`sourceUuid` से) `channels.signal.allowFrom` में `uuid:<id>` के रूप में संग्रहीत किए जाते हैं।

समूह:

- `channels.signal.groupPolicy = open | allowlist | disabled`।
- जब `allowlist` सेट हो, तो `channels.signal.groupAllowFrom` नियंत्रित करता है कि कौन-से समूह या प्रेषक समूह उत्तर ट्रिगर कर सकते हैं; प्रविष्टियाँ Signal समूह ID (रॉ, `group:<id>`, या `signal:group:<id>`), प्रेषक फ़ोन नंबर, `uuid:<id>` मान, या `*` हो सकती हैं।
- `channels.signal.groups["<group-id>" | "*"]`, `requireMention`, `tools`, और `toolsBySender` के साथ समूह व्यवहार को ओवरराइड कर सकता है।
- बहु-खाता सेटअप में प्रति-खाता ओवरराइड के लिए `channels.signal.accounts.<id>.groups` का उपयोग करें।
- `groupAllowFrom` के माध्यम से किसी Signal समूह को अनुमति-सूची में जोड़ने भर से उल्लेख गेटिंग अक्षम नहीं होती। विशेष रूप से कॉन्फ़िगर की गई `channels.signal.groups["<group-id>"]` प्रविष्टि प्रत्येक समूह संदेश को प्रोसेस करती है, जब तक कि `requireMention=true` सेट न हो।
- `requireMention=true` के साथ, संरचित उल्लेख मेटाडेटा से Signal के नेटिव @mentions का मिलान बॉट खाते के फ़ोन या `accountUuid` से किया जाता है। कॉन्फ़िगर किए गए `mentionPatterns` सामान्य टेक्स्ट फ़ॉलबैक बने रहते हैं।
- रनटाइम टिप्पणी: यदि `channels.signal` पूरी तरह अनुपस्थित हो, तो रनटाइम समूह जाँच के लिए `groupPolicy="allowlist"` पर फ़ॉलबैक करता है (भले ही `channels.defaults.groupPolicy` सेट हो)।

सीमित संदर्भ वाला उल्लेख-गेटेड समूह:

```json5
{
  channels: {
    signal: {
      account: "+15551234567",
      accountUuid: "bot-signal-uuid",
      groupPolicy: "allowlist",
      groupAllowFrom: ["group:<signal-group-id>"],
      historyLimit: 8,
      groups: {
        "<signal-group-id>": { requireMention: true },
      },
    },
  },
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
}
```

अनुमत समूह संदेश जो बॉट का उल्लेख नहीं करते, मौन रहते हैं और केवल सीमित लंबित इतिहास विंडो में रखे जाते हैं। जब बाद में कोई नेटिव @mention या फ़ॉलबैक टेक्स्ट उल्लेख बॉट को सक्रिय करता है, तो OpenClaw उस हालिया संदर्भ को शामिल करता है और उसी समूह में उत्तर देता है। छोड़ी गई अटैचमेंट सामग्री डाउनलोड नहीं की जाती; वह लंबित संदर्भ में केवल संक्षिप्त मीडिया प्लेसहोल्डर के रूप में दिखाई दे सकती है।

## यह कैसे काम करता है (व्यवहार)

- नेटिव मोड: `signal-cli` डेमन के रूप में चलता है; Gateway SSE के माध्यम से इवेंट पढ़ता है।
- कंटेनर मोड: Gateway REST API के माध्यम से भेजता है और WebSocket के माध्यम से प्राप्त करता है।
- आने वाले संदेशों को साझा चैनल एनवेलप में सामान्यीकृत किया जाता है।
- उत्तर हमेशा उसी नंबर या समूह पर वापस भेजे जाते हैं।
- जब बैकएंड आने वाले संदेश का टाइमस्टैम्प और लेखक स्वीकार करता है, तो आने वाले संदेशों के उत्तरों में नेटिव Signal उद्धरण मेटाडेटा शामिल होता है; यदि उद्धरण मेटाडेटा अनुपलब्ध हो या अस्वीकार कर दिया जाए, तो OpenClaw उत्तर को सामान्य संदेश के रूप में भेजता है।
- नेटिव उद्धरण के उपयोग को `channels.signal.replyToMode = off | first | all | batched`, या प्रति-चैट-प्रकार ओवरराइड के लिए `channels.signal.replyToModeByChatType.direct/group` से कॉन्फ़िगर करें। `channels.signal.accounts.<id>` के अंतर्गत खाता-स्तरीय मानों को प्राथमिकता मिलती है।

## मीडिया + सीमाएँ

- बाहर भेजे जाने वाले टेक्स्ट को `channels.signal.textChunkLimit` (डिफ़ॉल्ट 4000) के अनुसार खंडों में बाँटा जाता है।
- वैकल्पिक नई-पंक्ति खंडीकरण: लंबाई के अनुसार खंडीकरण से पहले रिक्त पंक्तियों (अनुच्छेद सीमाओं) पर विभाजित करने के लिए `channels.signal.streaming.chunkMode="newline"` सेट करें।
- अटैचमेंट समर्थित हैं (`signal-cli` से base64 प्राप्त किया जाता है)।
- जब `contentType` अनुपलब्ध हो, तब वॉइस-नोट अटैचमेंट MIME फ़ॉलबैक के रूप में `signal-cli` फ़ाइलनाम का उपयोग करते हैं, ताकि ऑडियो ट्रांसक्रिप्शन फिर भी AAC वॉइस मेमो को वर्गीकृत कर सके।
- डिफ़ॉल्ट मीडिया सीमा: `channels.signal.mediaMaxMb` (डिफ़ॉल्ट 8)।
- मीडिया डाउनलोड करना छोड़ने के लिए `channels.signal.ignoreAttachments` का उपयोग करें।
- समूह इतिहास संदर्भ `channels.signal.historyLimit` (या `channels.signal.accounts.*.historyLimit`) का उपयोग करता है और उपलब्ध न होने पर `messages.groupChat.historyLimit` का उपयोग करता है। अक्षम करने के लिए `0` सेट करें (डिफ़ॉल्ट 50)।

## टाइपिंग + पठन रसीदें

- **टाइपिंग संकेतक**: OpenClaw `signal-cli sendTyping` के माध्यम से टाइपिंग सिग्नल भेजता है और उत्तर तैयार होते समय उन्हें रीफ़्रेश करता रहता है।
- **पठन रसीदें**: जब `channels.signal.sendReadReceipts` true हो, तो OpenClaw अनुमत DM के लिए पठन रसीदें अग्रेषित करता है।
- `signal-cli` समूहों के लिए पठन रसीदें उपलब्ध नहीं कराता।

## जीवनचक्र स्थिति प्रतिक्रियाएँ

आने वाले टर्न पर Signal को साझा कतारबद्ध/सोच/टूल/Compaction/पूर्ण/त्रुटि प्रतिक्रिया जीवनचक्र दिखाने देने के लिए `messages.statusReactions.enabled: true` सेट करें। Signal आने वाले संदेश के टाइमस्टैम्प को प्रतिक्रिया लक्ष्य के रूप में उपयोग करता है; समूह प्रतिक्रियाएँ Signal समूह ID और मूल प्रेषक को लक्ष्य लेखक बनाकर भेजी जाती हैं।

स्थिति प्रतिक्रियाओं के लिए एक स्वीकृति प्रतिक्रिया और मेल खाता `messages.ackReactionScope` (`direct`, `group-all`, `group-mentions`, या `all`) भी आवश्यक है। Signal स्थिति प्रतिक्रियाएँ अक्षम करने के लिए `channels.signal.reactionLevel: "off"` सेट करें।

`messages.removeAckAfterReply: true` कॉन्फ़िगर किए गए होल्ड समय के बाद अंतिम स्थिति प्रतिक्रिया हटा देता है। अन्यथा Signal अंतिम पूर्ण/त्रुटि स्थिति के बाद आरंभिक स्वीकृति प्रतिक्रिया पुनर्स्थापित करता है।

## प्रतिक्रियाएँ (संदेश टूल)

`message action=react` का उपयोग `channel=signal` के साथ करें।

- लक्ष्य: प्रेषक का E.164 या UUID (पेयरिंग आउटपुट से `uuid:<id>` का उपयोग करें; केवल UUID भी काम करता है)।
- `messageId` उस संदेश का Signal टाइमस्टैम्प है जिस पर आप प्रतिक्रिया दे रहे हैं।
- समूह प्रतिक्रियाओं के लिए `targetAuthor` या `targetAuthorUuid` आवश्यक है।

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

कॉन्फ़िगरेशन:

- `channels.signal.actions.reactions`: प्रतिक्रिया क्रियाएँ सक्षम/अक्षम करें (डिफ़ॉल्ट true)।
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (डिफ़ॉल्ट `minimal`)।
  - `off`/`ack` एजेंट प्रतिक्रियाएँ अक्षम करता है (संदेश टूल `react` त्रुटि देता है)।
  - `minimal`/`extensive` एजेंट प्रतिक्रियाएँ सक्षम करता है और मार्गदर्शन स्तर सेट करता है।
- प्रति-खाता ओवरराइड: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`।

## अनुमोदन प्रतिक्रियाएँ

Signal निष्पादन और Plugin अनुमोदन प्रॉम्प्ट शीर्ष-स्तरीय `approvals.exec` और `approvals.plugin` रूटिंग ब्लॉक का उपयोग करते हैं। Signal में कोई `channels.signal.execApprovals` ब्लॉक नहीं है।

- `👍` एक बार के लिए अनुमोदन देता है।
- `👎` अस्वीकार करता है।
- जब कोई अनुरोध स्थायी अनुमोदन का विकल्प देता है, तो `/approve <id> allow-always` का उपयोग करें।

अनुमोदन प्रतिक्रिया के समाधान के लिए `channels.signal.allowFrom`, `channels.signal.defaultTo`, या मेल खाने वाले खाता-स्तरीय फ़ील्ड से स्पष्ट Signal अनुमोदक आवश्यक होते हैं। सीधे उसी चैट में आने वाले निष्पादन अनुमोदन प्रॉम्प्ट स्पष्ट अनुमोदकों के बिना भी डुप्लिकेट स्थानीय `/approve` फ़ॉलबैक को छिपा सकते हैं; अनुमोदक-रहित समूह अनुमोदन स्थानीय फ़ॉलबैक को दृश्यमान रखते हैं।

## प्रश्न प्रतिक्रियाएँ

एक गैर-गोपनीय, एकल-चयन प्रश्न और एक से चार विकल्पों वाले `ask_user` प्रॉम्प्ट के लिए, Signal विकल्प लेबलों के पास `1️⃣` से `4️⃣` तक दिखाता है। उत्तर देने के लिए वितरित प्रॉम्प्ट पर मेल खाने वाली संख्या से प्रतिक्रिया दें। OpenClaw सत्यापित करता है कि प्रतिक्रिया बॉट द्वारा लिखे गए संदेश को लक्षित करती है, फिर Gateway के माध्यम से संख्या को मानक विकल्प से मैप करता है। पुराने या डुप्लिकेट टैप अनदेखे किए जाते हैं। बहु-प्रश्न, बहु-चयन और मुक्त-टेक्स्ट प्रॉम्प्ट में केवल टेक्स्ट उत्तर दिया जा सकता है; सामान्य Signal DM/समूह प्रवेश नियम प्रेषक को अधिकृत करते हैं।

## वितरण लक्ष्य (CLI/Cron)

- DM: `signal:+15551234567` (या सामान्य E.164)।
- UUID DM: `uuid:<id>` (या केवल UUID)।
- समूह: `signal:group:<groupId>`।
- उपयोगकर्ता नाम: `username:<name>` (यदि आपके Signal खाते द्वारा समर्थित हो)।

## उपनाम

बार-बार उपयोग किए जाने वाले Signal लक्ष्यों के स्थिर नामों हेतु उपनाम कॉन्फ़िगर करें। उपनाम केवल OpenClaw-पक्षीय कॉन्फ़िगरेशन हैं; वे Signal संपर्क बनाते या संपादित नहीं करते।

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
        jane: "uuid:123e4567-e89b-12d3-a456-426614174000",
        ops: "group:<groupId>",
      },
      defaultTo: "signal:me",
    },
  },
}
```

जहाँ भी Signal वितरण लक्ष्य स्वीकार किए जाते हैं, वहाँ उपनामों का उपयोग करें:

```bash
openclaw message send --channel signal --target signal:ops --message "परिनियोजन पूर्ण हो गया है"
```

प्रति-खाता उपनाम शीर्ष-स्तरीय उपनामों को इनहेरिट करते हैं और नाम जोड़ या ओवरराइड कर सकते हैं:

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
      },
      accounts: {
        work: {
          aliases: {
            ops: "group:<workGroupId>",
          },
        },
      },
    },
  },
}
```

`openclaw directory peers list --channel signal` और `openclaw directory groups list --channel signal` कॉन्फ़िगर किए गए उपनामों को सूचीबद्ध करते हैं। Signal निर्देशिका कॉन्फ़िगरेशन-समर्थित है; यह Signal संपर्कों से लाइव क्वेरी नहीं करती या Signal खाते में बदलाव नहीं करती।

## समस्या निवारण

पहले यह क्रम चलाएँ:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

फिर आवश्यकता होने पर DM पेयरिंग स्थिति की पुष्टि करें:

```bash
openclaw pairing list signal
```

सामान्य विफलताएँ:

- डेमन पहुँच योग्य है लेकिन कोई उत्तर नहीं: खाता/डेमन सेटिंग (`httpUrl`, `account`) और प्राप्ति मोड सत्यापित करें।
- DM अनदेखे किए गए: प्रेषक का पेयरिंग अनुमोदन लंबित है।
- समूह संदेश अनदेखे किए गए: समूह प्रेषक/उल्लेख गेटिंग वितरण को अवरुद्ध कर रही है।
- संपादन के बाद कॉन्फ़िगरेशन सत्यापन त्रुटियाँ: `openclaw doctor --fix` चलाएँ।
- निदान में Signal अनुपलब्ध: `channels.signal.enabled: true` की पुष्टि करें।

अतिरिक्त जाँच:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

ट्रायेज प्रवाह के लिए: [चैनल समस्या निवारण](/hi/channels/troubleshooting)।

## सुरक्षा संबंधी टिप्पणियाँ

- `signal-cli` खाता कुंजियाँ स्थानीय रूप से संग्रहीत करता है (आमतौर पर `~/.local/share/signal-cli/data/`)।
- सर्वर माइग्रेशन या पुनर्निर्माण से पहले Signal खाते की स्थिति का बैकअप लें।
- जब तक आप स्पष्ट रूप से व्यापक DM पहुँच नहीं चाहते, `channels.signal.dmPolicy: "pairing"` बनाए रखें।
- SMS सत्यापन केवल पंजीकरण या पुनर्प्राप्ति प्रवाहों के लिए आवश्यक है, लेकिन नंबर/खाते का नियंत्रण खोने से पुनः पंजीकरण जटिल हो सकता है।

## कॉन्फ़िगरेशन संदर्भ (Signal)

पूर्ण कॉन्फ़िगरेशन: [कॉन्फ़िगरेशन](/hi/gateway/configuration)

प्रदाता विकल्प:

- `channels.signal.enabled`: चैनल स्टार्टअप सक्षम/अक्षम करें।
- `channels.signal.apiMode`: `auto | native | container` (डिफ़ॉल्ट: स्वतः)। [कंटेनर मोड](#container-mode-bbernhardsignal-cli-rest-api) देखें।
- `channels.signal.account`: बॉट खाते के लिए E.164।
- `channels.signal.accountUuid`: मूल @mention पहचान और लूप सुरक्षा के लिए वैकल्पिक बॉट खाता UUID।
- `channels.signal.cliPath`: `signal-cli` का पथ।
- `channels.signal.configPath`: वैकल्पिक `signal-cli --config` डायरेक्टरी।
- `channels.signal.httpUrl`: पूर्ण डेमन URL (होस्ट/पोर्ट को ओवरराइड करता है)।
- `channels.signal.httpHost`, `channels.signal.httpPort`: डेमन बाइंड (डिफ़ॉल्ट `127.0.0.1:8080`)।
- `channels.signal.autoStart`: डेमन को स्वतः आरंभ करें (यदि `httpUrl` सेट नहीं है, तो डिफ़ॉल्ट true)।
- `channels.signal.startupTimeoutMs`: स्टार्टअप प्रतीक्षा टाइमआउट ms में (न्यूनतम 1000, अधिकतम 120000; डिफ़ॉल्ट 30000)।
- `channels.signal.receiveMode`: `on-start | manual`।
- `channels.signal.ignoreAttachments`: अटैचमेंट डाउनलोड छोड़ें।
- `channels.signal.ignoreStories`: डेमन से प्राप्त स्टोरीज़ को अनदेखा करें।
- `channels.signal.sendReadReceipts`: पठन रसीदें अग्रेषित करें।
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (डिफ़ॉल्ट: पेयरिंग)।
- `channels.signal.allowFrom`: DM अनुमति-सूची (E.164 या `uuid:<id>`)। `open` के लिए `"*"` आवश्यक है। Signal में उपयोगकर्ता नाम नहीं होते; फ़ोन/UUID ID का उपयोग करें।
- `channels.signal.aliases`: DM या समूह डिलीवरी लक्ष्यों के लिए OpenClaw-पक्ष के उपनाम।
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (डिफ़ॉल्ट: अनुमति-सूची)।
- `channels.signal.groupAllowFrom`: समूह अनुमति-सूची; Signal समूह ID (रॉ, `group:<id>`, या `signal:group:<id>`), प्रेषक की E.164 संख्याएँ, या `uuid:<id>` मान स्वीकार करती है।
- `channels.signal.groups`: Signal समूह ID (या `"*"`) द्वारा कुंजीबद्ध प्रति-समूह ओवरराइड। समर्थित फ़ील्ड: `requireMention`, `tools`, `toolsBySender`।
- `channels.signal.accounts.<id>.groups`: बहु-खाता सेटअप के लिए `channels.signal.groups` का प्रति-खाता संस्करण।
- `channels.signal.accounts.<id>.aliases`: प्रति-खाता उपनाम, शीर्ष-स्तरीय उपनामों के साथ मर्ज किए जाते हैं।
- `channels.signal.replyToMode`: मूल उत्तर उद्धरण मोड, `off | first | all | batched` (डिफ़ॉल्ट: `all`)।
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: प्रति-चैट-प्रकार मूल उत्तर उद्धरण ओवरराइड।
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: प्रति-खाता उत्तर उद्धरण ओवरराइड।
- `channels.signal.historyLimit`: संदर्भ के रूप में शामिल किए जाने वाले समूह संदेशों की अधिकतम संख्या (0 अक्षम करता है)।
- `channels.signal.dmHistoryLimit`: उपयोगकर्ता टर्न में DM इतिहास सीमा। प्रति-उपयोगकर्ता ओवरराइड: `channels.signal.dms["<phone_or_uuid>"].historyLimit`।
- `channels.signal.textChunkLimit`: वर्णों में आउटबाउंड खंड आकार (डिफ़ॉल्ट 4000)।
- `channels.signal.streaming.chunkMode`: लंबाई के आधार पर खंड बनाने से पहले रिक्त पंक्तियों (अनुच्छेद सीमाओं) पर विभाजित करने के लिए `length` (डिफ़ॉल्ट) या `newline`।
- `channels.signal.mediaMaxMb`: MB में इनबाउंड/आउटबाउंड मीडिया सीमा (डिफ़ॉल्ट 8)।
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (डिफ़ॉल्ट `minimal`)। [प्रतिक्रियाएँ](#reactions-message-tool) देखें।
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (डिफ़ॉल्ट `own`) - जब एजेंट को अन्य लोगों से आने वाली प्रतिक्रियाओं की सूचना दी जाती है।
- `channels.signal.reactionAllowlist`: वे प्रेषक जिनकी प्रतिक्रियाएँ `reactionNotifications: "allowlist"` होने पर एजेंट को सूचित करती हैं।
- `channels.signal.streaming.block.enabled`, `channels.signal.streaming.block.coalesce`: चैनलों में साझा किए गए ब्लॉक-मोड स्ट्रीमिंग नियंत्रण। [स्ट्रीमिंग](/hi/concepts/streaming) देखें।

संबंधित वैश्विक विकल्प:

- `agents.list[].groupChat.mentionPatterns` (सादा-पाठ फ़ॉलबैक; बॉट खाते की पहचान कॉन्फ़िगर होने पर Signal के मूल @mentions की पहचान संरचित मेटाडेटा से की जाती है)।
- `messages.groupChat.mentionPatterns` (वैश्विक फ़ॉलबैक)।
- `messages.responsePrefix`।

## संबंधित

- [चैनलों का अवलोकन](/hi/channels) - सभी समर्थित चैनल
- [पेयरिंग](/hi/channels/pairing) - DM प्रमाणीकरण और पेयरिंग प्रवाह
- [समूह](/hi/channels/groups) - समूह चैट व्यवहार और उल्लेख गेटिंग
- [चैनल रूटिंग](/hi/channels/channel-routing) - संदेशों के लिए सत्र रूटिंग
- [सुरक्षा](/hi/gateway/security) - अभिगम मॉडल और सुदृढ़ीकरण
