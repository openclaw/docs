---
read_when:
    - आप OpenClaw को QQ से कनेक्ट करना चाहते हैं
    - आपको QQ Bot क्रेडेंशियल सेटअप की आवश्यकता है
    - आप QQ Bot के समूह या निजी चैट समर्थन चाहते हैं
summary: QQ Bot सेटअप, कॉन्फ़िगरेशन, और उपयोग
title: QQ बॉट
x-i18n:
    generated_at: "2026-06-28T22:38:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb452e331ce196d1517af2f87a5187cb4b2cb53aee2bbff47cbdf73e2b3e7dee
    source_path: channels/qqbot.md
    workflow: 16
---

QQ Bot आधिकारिक QQ Bot API (WebSocket gateway) के माध्यम से OpenClaw से जुड़ता है। यह
Plugin C2C निजी चैट, समूह @messages, और गिल्ड चैनल संदेशों को
समृद्ध मीडिया (चित्र, आवाज़, वीडियो, फ़ाइलें) के साथ समर्थित करता है।

स्थिति: डाउनलोड करने योग्य Plugin। डायरेक्ट संदेश, समूह चैट, गिल्ड चैनल, और
मीडिया समर्थित हैं। प्रतिक्रियाएँ और थ्रेड समर्थित नहीं हैं।

## इंस्टॉल करें

सेटअप से पहले QQ Bot इंस्टॉल करें:

```bash
openclaw plugins install @openclaw/qqbot
```

## सेटअप

1. [QQ Open Platform](https://q.qq.com/) पर जाएँ और पंजीकरण / लॉग इन करने के लिए अपने
   फ़ोन QQ से QR कोड स्कैन करें।
2. नया QQ bot बनाने के लिए **Create Bot** पर क्लिक करें।
3. bot के सेटिंग पेज पर **AppID** और **AppSecret** खोजें और उन्हें कॉपी करें।

> AppSecret सादे पाठ में संग्रहित नहीं होता — यदि आप उसे सहेजे बिना पेज छोड़ देते हैं,
> तो आपको नया AppSecret फिर से जनरेट करना होगा।

4. चैनल जोड़ें:

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. Gateway पुनः शुरू करें।

इंटरैक्टिव सेटअप पथ:

```bash
openclaw channels add
openclaw configure --section channels
```

## कॉन्फ़िगर करें

न्यूनतम कॉन्फ़िग:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

डिफ़ॉल्ट-खाता env vars:

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

फ़ाइल-समर्थित AppSecret:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

Env SecretRef AppSecret:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: { source: "env", provider: "default", id: "QQBOT_CLIENT_SECRET" },
    },
  },
}
```

नोट:

- Env फ़ॉलबैक केवल डिफ़ॉल्ट QQ Bot खाते पर लागू होता है।
- `openclaw channels add --channel qqbot --token-file ...` केवल
  AppSecret देता है; AppID पहले से कॉन्फ़िग में या `QQBOT_APP_ID` में सेट होना चाहिए।
- `clientSecret` केवल सादे पाठ की स्ट्रिंग ही नहीं, SecretRef इनपुट भी स्वीकार करता है।
- पुराने `secretref:/...` मार्कर स्ट्रिंग मान्य `clientSecret` मान नहीं हैं;
  ऊपर दिए गए उदाहरण जैसे संरचित SecretRef ऑब्जेक्ट इस्तेमाल करें।

### बहु-खाता सेटअप

एक ही OpenClaw इंस्टेंस के अंतर्गत कई QQ bots चलाएँ:

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

हर खाता अपना अलग WebSocket कनेक्शन शुरू करता है और स्वतंत्र
टोकन कैश बनाए रखता है (`appId` द्वारा अलग किया गया)।

CLI के माध्यम से दूसरा bot जोड़ें:

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### समूह चैट

QQ Bot समूह चैट समर्थन QQ समूह OpenIDs का उपयोग करता है, प्रदर्शन नामों का नहीं। bot को
किसी समूह में जोड़ें, फिर उसका उल्लेख करें या समूह को बिना उल्लेख के चलने के लिए कॉन्फ़िगर करें।

```json5
{
  channels: {
    qqbot: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["member_openid"],
      groups: {
        "*": {
          requireMention: true,
          commandLevel: "all",
          historyLimit: 50,
          tools: { deny: ["exec", "read", "write"] },
        },
        GROUP_OPENID: {
          name: "Release room",
          requireMention: false,
          ignoreOtherMentions: true,
          commandLevel: "safety",
          historyLimit: 20,
          prompt: "Keep replies short and operational.",
        },
      },
    },
  },
}
```

`groups["*"]` हर समूह के लिए डिफ़ॉल्ट सेट करता है, और कोई ठोस
`groups.GROUP_OPENID` प्रविष्टि एक समूह के लिए उन डिफ़ॉल्ट को ओवरराइड करती है। समूह
सेटिंग में शामिल हैं:

- `requireMention`: bot के जवाब देने से पहले @mention आवश्यक करें। डिफ़ॉल्ट: `true`।
- `commandLevel`: नियंत्रित करें कि समूहों में कौन से अंतर्निहित स्लैश कमांड चल सकते हैं।
  डिफ़ॉल्ट: `all`, जो सेटिंग छोड़े जाने पर पहले से मौजूद QQBot समूह व्यवहार को सुरक्षित रखता है।
- `ignoreOtherMentions`: वे संदेश छोड़ें जिनमें किसी और का उल्लेख है लेकिन bot का नहीं।
- `historyLimit`: अगले उल्लेखित टर्न के संदर्भ के लिए हाल के गैर-उल्लेख समूह संदेश रखें। अक्षम करने के लिए `0` सेट करें।
- `tools`: पूरे समूह के लिए टूल अनुमति दें/नकारें।
- `toolsBySender`: प्रति-प्रेषक समूह टूल ओवरराइड; [समूह](/hi/channels/groups#groupchannel-tool-restrictions-optional) देखें।
- `name`: लॉग और समूह संदर्भ में इस्तेमाल होने वाला मैत्रीपूर्ण लेबल।
- `prompt`: agent संदर्भ में जोड़ा गया प्रति-समूह व्यवहार प्रॉम्प्ट।

`commandLevel` स्वीकार करता है:

- `all`: पहचाने गए अंतर्निहित कमांड पहले की तरह उपलब्ध रखें। कुछ कमांड
  मेन्यू से छिपे रह सकते हैं, लेकिन अधिकृत उपयोगकर्ता फिर भी उन्हें समूह में चला सकते हैं।
- `safety`: `/help`, `/btw`, और
  `/stop` जैसे सामान्य सहयोग कमांड की अनुमति दें; उपयोगकर्ताओं से `/config`, `/tools`, और
  `/bash` जैसे संवेदनशील कमांड निजी चैट में चलाने को कहें।
- `strict`: सख्त समूह संचालन के लिए आवश्यक समूह-सत्र नियंत्रणों की ही अनुमति दें।
  `/stop` फिर भी तात्कालिक रहता है ताकि कोई अधिकृत प्रेषक सक्रिय रन को बाधित कर सके।

पुरानी QQBot `toolPolicy` प्रविष्टियाँ रिटायर कर दी गई हैं। उन्हें `tools` में माइग्रेट करने के लिए `openclaw doctor --fix` चलाएँ।

सक्रियण मोड `mention` और `always` हैं। `requireMention: true` का मैप
`mention` पर होता है; `requireMention: false` का मैप `always` पर होता है। सत्र-स्तर सक्रियण
ओवरराइड, मौजूद होने पर, कॉन्फ़िग से ऊपर लागू होता है।

इनबाउंड क्यू प्रति पीयर होती है। समूह पीयर को बड़ी क्यू सीमा मिलती है, भर जाने पर मानव
संदेशों को bot-लिखित बातचीत से आगे रखा जाता है, और सामान्य
समूह संदेशों के बर्स्ट को एक श्रेयांकित टर्न में मर्ज किया जाता है। स्लैश कमांड फिर भी एक-एक करके चलते हैं।

### आवाज़ (STT / TTS)

STT और TTS प्राथमिकता फ़ॉलबैक के साथ दो-स्तरीय कॉन्फ़िगरेशन समर्थित करते हैं:

| सेटिंग | Plugin-विशिष्ट                                          | फ़्रेमवर्क फ़ॉलबैक            |
| ------- | -------------------------------------------------------- | ----------------------------- |
| STT     | `channels.qqbot.stt`                                     | `tools.media.audio.models[0]` |
| TTS     | `channels.qqbot.tts`, `channels.qqbot.accounts.<id>.tts` | `messages.tts`                |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
      accounts: {
        "qq-main": {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

किसी भी एक को अक्षम करने के लिए उस पर `enabled: false` सेट करें।
खाता-स्तर TTS ओवरराइड `messages.tts` जैसा ही आकार इस्तेमाल करते हैं और चैनल/वैश्विक TTS कॉन्फ़िग के ऊपर डीप-मर्ज होते हैं।

इनबाउंड QQ आवाज़ अटैचमेंट raw आवाज़ फ़ाइलों को सामान्य `MediaPaths` से बाहर रखते हुए
agents को ऑडियो मीडिया मेटाडेटा के रूप में दिखाए जाते हैं। TTS कॉन्फ़िग होने पर `[[audio_as_voice]]` सादा
पाठ उत्तर TTS संश्लेषित करते हैं और एक नेटिव QQ आवाज़ संदेश भेजते हैं।

आउटबाउंड ऑडियो अपलोड/ट्रांसकोड व्यवहार को
`channels.qqbot.audioFormatPolicy` से भी ट्यून किया जा सकता है:

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## लक्ष्य प्रारूप

| प्रारूप                    | विवरण             |
| -------------------------- | ------------------ |
| `qqbot:c2c:OPENID`         | निजी चैट (C2C) |
| `qqbot:group:GROUP_OPENID` | समूह चैट         |
| `qqbot:channel:CHANNEL_ID` | गिल्ड चैनल      |

> हर bot के पास user OpenIDs का अपना सेट होता है। Bot A द्वारा प्राप्त OpenID का उपयोग Bot B के माध्यम से संदेश भेजने के लिए **नहीं किया जा सकता**।

## स्लैश कमांड

AI क्यू से पहले पकड़े जाने वाले अंतर्निहित कमांड:

| कमांड         | विवरण                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/bot-ping`    | विलंबता परीक्षण                                                                                             |
| `/bot-version` | OpenClaw फ़्रेमवर्क संस्करण दिखाएँ                                                                      |
| `/bot-help`    | सभी कमांड सूचीबद्ध करें                                                                                        |
| `/bot-me`      | `allowFrom`/`groupAllowFrom` सेटअप के लिए प्रेषक का QQ user ID (openid) दिखाएँ                             |
| `/bot-upgrade` | QQBot अपग्रेड गाइड लिंक दिखाएँ                                                                        |
| `/bot-logs`    | हाल के gateway लॉग को फ़ाइल के रूप में एक्सपोर्ट करें                                                                     |
| `/bot-approve` | लंबित QQ Bot कार्रवाई को नेटिव प्रवाह के माध्यम से स्वीकृत करें (उदाहरण के लिए, C2C या समूह अपलोड की पुष्टि करना)। |

उपयोग सहायता के लिए किसी भी कमांड में `?` जोड़ें (उदाहरण के लिए `/bot-upgrade ?`)।

Admin कमांड (`/bot-me`, `/bot-upgrade`, `/bot-logs`, `/bot-clear-storage`, `/bot-streaming`, `/bot-approve`) केवल डायरेक्ट संदेश में उपलब्ध हैं और इनके लिए प्रेषक का openid स्पष्ट गैर-वाइल्डकार्ड `allowFrom` सूची में होना आवश्यक है। वाइल्डकार्ड `allowFrom: ["*"]` चैट की अनुमति देता है लेकिन admin कमांड एक्सेस नहीं देता। समूह संदेश पहले `groupAllowFrom` से मिलाए जाते हैं और फिर `allowFrom` पर फ़ॉलबैक करते हैं। समूह में admin कमांड चलाने पर चुपचाप छोड़ने के बजाय एक संकेत लौटता है।

जब QQ Bot exec अनुमोदन डिफ़ॉल्ट समान-चैट फ़ॉलबैक का उपयोग करते हैं, तो नेटिव अनुमोदन
बटन क्लिक उसी स्पष्ट गैर-वाइल्डकार्ड कमांड अनुमति-सूची का पालन करते हैं। व्यापक कमांड एक्सेस के बिना
केवल अनुमोदन एक्सेस देने के लिए
`channels.qqbot.execApprovals.approvers` कॉन्फ़िगर करें।

## इंजन आर्किटेक्चर

QQ Bot Plugin के अंदर एक स्व-समाहित इंजन के रूप में भेजा जाता है:

- हर खाता `appId` से कुंजीबद्ध एक अलग संसाधन स्टैक (WebSocket कनेक्शन, API client, token cache, media storage root) का मालिक होता है। खाते कभी भी इनबाउंड/आउटबाउंड स्थिति साझा नहीं करते।
- बहु-खाता logger लॉग पंक्तियों को मालिक खाते के साथ टैग करता है, ताकि एक gateway के अंतर्गत कई bots चलाने पर डायग्नोस्टिक्स अलग-अलग रहें।
- इनबाउंड, आउटबाउंड, और gateway bridge पथ `~/.openclaw/media` के अंतर्गत एक ही मीडिया पेलोड root साझा करते हैं, ताकि uploads, downloads, और transcode caches प्रति-सबसिस्टम ट्री के बजाय एक संरक्षित डायरेक्टरी के अंतर्गत रहें।
- समृद्ध मीडिया डिलीवरी C2C और समूह लक्ष्यों के लिए एक `sendMedia` पथ से गुजरती है। बड़ी-फ़ाइल सीमा से ऊपर की स्थानीय फ़ाइलें और बफ़र QQ के chunked upload endpoints का उपयोग करते हैं, जबकि छोटे payloads one-shot media API का उपयोग करते हैं।
- क्रेडेंशियल्स को मानक OpenClaw credential snapshots के हिस्से के रूप में बैक अप और रिस्टोर किया जा सकता है; इंजन रिस्टोर पर हर खाते के संसाधन स्टैक को फिर से अटैच करता है, बिना नई QR-code pair की आवश्यकता के।

## QR-code ऑनबोर्डिंग

`AppID:AppSecret` को मैन्युअल रूप से पेस्ट करने के विकल्प के रूप में, इंजन QQ Bot को OpenClaw से लिंक करने के लिए QR-code ऑनबोर्डिंग प्रवाह समर्थित करता है:

1. QQ Bot सेटअप पथ चलाएँ (उदाहरण के लिए `openclaw channels add --channel qqbot`) और संकेत मिलने पर QR-code प्रवाह चुनें।
2. लक्ष्य QQ Bot से जुड़े फ़ोन ऐप से जनरेट किया गया QR कोड स्कैन करें।
3. फ़ोन पर pairing स्वीकृत करें। OpenClaw लौटाए गए क्रेडेंशियल्स को सही खाता scope के अंतर्गत `credentials/` में सुरक्षित रखता है।

bot द्वारा स्वयं जनरेट किए गए अनुमोदन प्रॉम्प्ट (उदाहरण के लिए, QQ Bot API द्वारा उजागर "allow this action?" प्रवाह) नेटिव OpenClaw प्रॉम्प्ट के रूप में दिखाई देते हैं, जिन्हें raw QQ client के माध्यम से उत्तर देने के बजाय `/bot-approve` से स्वीकार किया जा सकता है।

## समस्या निवारण

- **बॉट जवाब देता है "मंगल पर चला गया":** क्रेडेंशियल कॉन्फ़िगर नहीं हैं या Gateway शुरू नहीं हुआ है।
- **कोई इनबाउंड संदेश नहीं:** सत्यापित करें कि `appId` और `clientSecret` सही हैं, और
  बॉट QQ Open Platform पर सक्षम है।
- **बार-बार स्वयं-जवाब:** OpenClaw QQ आउटबाउंड रेफ इंडेक्स को
  बॉट-लिखित के रूप में रिकॉर्ड करता है और उन इनबाउंड इवेंट्स को अनदेखा करता है जिनका वर्तमान `msgIdx` उसी
  बॉट खाते से मेल खाता है। यह प्लेटफ़ॉर्म इको लूप्स को रोकता है, जबकि उपयोगकर्ताओं को
  पिछले बॉट संदेशों को उद्धृत करने या उनका जवाब देने की अनुमति देता है।
- **`--token-file` के साथ सेटअप फिर भी अनकॉन्फ़िगर दिखाता है:** `--token-file` केवल
  AppSecret सेट करता है। आपको अभी भी कॉन्फ़िग में `appId` या `QQBOT_APP_ID` चाहिए।
- **प्रोएक्टिव संदेश नहीं आ रहे:** यदि उपयोगकर्ता ने हाल ही में इंटरैक्ट नहीं किया है, तो QQ बॉट-आरंभ किए गए संदेशों को रोक सकता है।
- **आवाज़ का ट्रांसक्रिप्शन नहीं हुआ:** सुनिश्चित करें कि STT कॉन्फ़िगर है और प्रदाता पहुँच योग्य है।

## संबंधित

- [पेयरिंग](/hi/channels/pairing)
- [समूह](/hi/channels/groups)
- [चैनल समस्या निवारण](/hi/channels/troubleshooting)
