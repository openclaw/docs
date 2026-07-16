---
read_when:
    - OpenClaw के लिए Zalo Personal सेट अप करना
    - Zalo Personal लॉगिन या संदेश प्रवाह की डीबगिंग
summary: मूल zca-js (QR लॉगिन) के माध्यम से Zalo व्यक्तिगत खाते का समर्थन, क्षमताएँ और कॉन्फ़िगरेशन
title: Zalo व्यक्तिगत
x-i18n:
    generated_at: "2026-07-16T13:40:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 962697c4a56dfb733fe4973e23129ccb365506e35c09e673365842f45a837949
    source_path: channels/zalouser.md
    workflow: 16
---

स्थिति: प्रयोगात्मक। यह एकीकरण बिना किसी बाहरी CLI बाइनरी के, इन-प्रोसेस मूल `zca-js` के माध्यम से एक **व्यक्तिगत Zalo खाते** को स्वचालित करता है।

<Warning>
यह एक अनाधिकारिक एकीकरण है और इसके परिणामस्वरूप खाता निलंबित या प्रतिबंधित हो सकता है। इसका उपयोग अपने जोखिम पर करें।
</Warning>

## इंस्टॉल करें

Zalo Personal एक आधिकारिक बाहरी Plugin है, जो कोर के साथ बंडल नहीं किया गया है। उपयोग से पहले इसे इंस्टॉल करें:

```bash
openclaw plugins install @openclaw/zalouser
```

- कोई संस्करण पिन करें: `openclaw plugins install @openclaw/zalouser@<version>`
- स्रोत चेकआउट से: `openclaw plugins install ./path/to/local/zalouser-plugin`
- विवरण: [Plugins](/hi/tools/plugin)

## त्वरित सेटअप

1. Plugin इंस्टॉल करें (ऊपर)।
2. लॉग इन करें (QR द्वारा, Gateway मशीन पर):
   - `openclaw channels login --channel zalouser`
   - Zalo मोबाइल ऐप से QR कोड स्कैन करें।
3. चैनल सक्षम करें:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Gateway पुनः आरंभ करें (या सेटअप पूरा करें)।
5. DM पहुँच डिफ़ॉल्ट रूप से पेयरिंग का उपयोग करती है; पहले संपर्क पर पेयरिंग कोड को स्वीकृत करें।

## यह क्या है

- `zca-js` लाइब्रेरी के माध्यम से पूरी तरह इन-प्रोसेस चलता है (कोई बाहरी `zca`/`openzca` बाइनरी नहीं)।
- आने वाले संदेश प्राप्त करने के लिए मूल इवेंट लिसनर (`message`, `error`) का उपयोग करता है।
- JS API के माध्यम से सीधे उत्तर भेजता है (टेक्स्ट/मीडिया/लिंक)।
- उन "व्यक्तिगत खाते" के उपयोग-मामलों के लिए डिज़ाइन किया गया है जहाँ Zalo Bot API उपलब्ध नहीं है।

## नामकरण

चैनल आईडी `zalouser` है, ताकि यह स्पष्ट हो कि यह एक **व्यक्तिगत Zalo उपयोगकर्ता खाते** को स्वचालित करता है (अनाधिकारिक)। `zalo` को भविष्य के संभावित आधिकारिक Zalo API एकीकरण के लिए आरक्षित रखा गया है।

## आईडी ढूँढना (डायरेक्टरी)

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## सीमाएँ

- आउटबाउंड टेक्स्ट को 2000 वर्णों के खंडों में बाँटा जाता है (Zalo क्लाइंट सीमा)।
- स्ट्रीमिंग समर्थित नहीं है।

## पहुँच नियंत्रण (DM)

`channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled` (डिफ़ॉल्ट: `pairing`)।

`channels.zalouser.allowFrom` में स्थायी Zalo उपयोगकर्ता आईडी का उपयोग होना चाहिए। यह स्थिर प्रेषक पहुँच समूहों (`accessGroup:<name>`) का संदर्भ भी दे सकता है। इंटरैक्टिव सेटअप के दौरान, दर्ज किए गए नामों को Plugin की इन-प्रोसेस संपर्क खोज का उपयोग करके आईडी में बदला जा सकता है।

यदि कॉन्फ़िगरेशन में कोई अपरिष्कृत नाम बचा रहता है, तो स्टार्टअप उसे केवल तब हल करता है जब `channels.zalouser.dangerouslyAllowNameMatching: true` सक्षम हो। उस ऑप्ट-इन के बिना, रनटाइम प्रेषक जाँच केवल आईडी पर आधारित होती है और प्राधिकरण के लिए अपरिष्कृत नामों को अनदेखा किया जाता है।

इसके माध्यम से स्वीकृत करें:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## समूह पहुँच (वैकल्पिक)

- डिफ़ॉल्ट: `channels.zalouser.groupPolicy = "allowlist"` (समूहों के लिए स्पष्ट अनुमतिसूची प्रविष्टि आवश्यक है)।
- सभी समूह खोलें: `channels.zalouser.groupPolicy = "open"`।
- सभी समूह अवरुद्ध करें: `channels.zalouser.groupPolicy = "disabled"`।
- `groupPolicy = "allowlist"` के साथ:
  - `channels.zalouser.groups` कुंजियाँ स्थायी समूह आईडी होनी चाहिए; नामों को स्टार्टअप पर केवल तब आईडी में बदला जाता है जब `channels.zalouser.dangerouslyAllowNameMatching: true` सक्षम हो।
  - `channels.zalouser.groupAllowFrom` यह नियंत्रित करता है कि अनुमत समूहों में कौन-से प्रेषक बॉट को ट्रिगर कर सकते हैं; स्थिर प्रेषक पहुँच समूहों को `accessGroup:<name>` से संदर्भित किया जा सकता है।
- कॉन्फ़िगरेशन विज़ार्ड समूह अनुमतिसूचियों के लिए संकेत दे सकता है।
- समूह अनुमतिसूची मिलान डिफ़ॉल्ट रूप से केवल आईडी पर आधारित है। जब तक `channels.zalouser.dangerouslyAllowNameMatching: true` सक्षम न हो, अनसुलझे नामों को प्राधिकरण के लिए अनदेखा किया जाता है।
- `channels.zalouser.dangerouslyAllowNameMatching: true` एक आपातकालीन संगतता मोड है, जो परिवर्तनशील स्टार्टअप नाम समाधान और रनटाइम समूह-नाम मिलान को फिर से सक्षम करता है।
- सामान्य समूह संदेशों के लिए `groupAllowFrom`, `allowFrom` पर **फ़ॉलबैक नहीं** करता: किसी अनुमतिसूचीबद्ध समूह में इसे खाली छोड़ने से वह समूह किसी भी प्रेषक के लिए खुल जाता है। अधिकृत नियंत्रण कमांड (उदाहरण के लिए `/new`) अपवाद हैं; जब `groupAllowFrom` खाली होता है, तब कमांड प्रेषक जाँच `allowFrom` पर फ़ॉलबैक करती है।

उदाहरण:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { enabled: true },
        "Work Chat": { enabled: true },
      },
    },
  },
}
```

<Note>
`channels.zalouser.groups.<id>.allow` एक पुराना फ़ील्ड नाम है; वर्तमान कॉन्फ़िगरेशन `enabled` का उपयोग करता है। `openclaw doctor --fix`, `allow` को स्वचालित रूप से `enabled` में माइग्रेट करता है।
</Note>

### समूह उल्लेख गेटिंग

- `channels.zalouser.groups.<group>.requireMention` नियंत्रित करता है कि समूह उत्तरों के लिए उल्लेख आवश्यक है या नहीं।
- समाधान क्रम: समूह आईडी -> `group:<id>` उपनाम -> समूह नाम/स्लग (नाम-आधारित उम्मीदवार केवल `dangerouslyAllowNameMatching: true` होने पर लागू होते हैं) -> `*` -> डिफ़ॉल्ट (`true`)।
- यह अनुमतिसूचीबद्ध समूहों और खुले समूह मोड, दोनों पर लागू होता है।
- किसी बॉट संदेश को उद्धृत करना समूह सक्रियण के लिए अंतर्निहित उल्लेख माना जाता है।
- अधिकृत नियंत्रण कमांड (उदाहरण के लिए `/new`) उल्लेख गेटिंग को बायपास कर सकते हैं।
- जब किसी समूह संदेश को इसलिए छोड़ दिया जाता है क्योंकि उल्लेख आवश्यक है, तो OpenClaw उसे लंबित समूह इतिहास के रूप में संग्रहीत करता है और अगले संसाधित समूह संदेश में शामिल करता है।
- समूह इतिहास सीमा: `channels.zalouser.historyLimit`, फिर `messages.groupChat.historyLimit`, फिर `50` का फ़ॉलबैक।

उदाहरण:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { enabled: true, requireMention: true },
        "Work Chat": { enabled: true, requireMention: false },
      },
    },
  },
}
```

## एकाधिक खाते

खाते OpenClaw स्थिति में `zalouser` प्रोफ़ाइलों से मैप होते हैं। उदाहरण:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## पर्यावरण चर

प्रोफ़ाइल चयन पर्यावरण चरों से भी आ सकता है:

| चर                | उद्देश्य                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| `ZALOUSER_PROFILE` | जब चैनल या खाता कॉन्फ़िगरेशन में कोई `profile` सेट न हो, तब उपयोग किया जाने वाला प्रोफ़ाइल नाम। |
| `ZCA_PROFILE`      | पुराना फ़ॉलबैक, जिसका उपयोग केवल तब होता है जब `ZALOUSER_PROFILE` सेट न हो।             |

प्रोफ़ाइल नाम OpenClaw स्थिति में सहेजे गए Zalo लॉगिन क्रेडेंशियल चुनते हैं। समाधान क्रम:

1. कॉन्फ़िगरेशन में स्पष्ट `profile`।
2. `ZALOUSER_PROFILE`।
3. `ZCA_PROFILE`।
4. गैर-डिफ़ॉल्ट खातों के लिए खाता आईडी, या डिफ़ॉल्ट खाते के लिए `default`।

एकाधिक-खाता सेटअप के लिए, कॉन्फ़िगरेशन में प्रत्येक खाते पर `profile` सेट करना बेहतर है, ताकि एक पर्यावरण चर के कारण कई खाते एक ही लॉगिन सत्र साझा न करें।

## टाइपिंग, प्रतिक्रियाएँ और डिलीवरी अभिस्वीकृतियाँ

- OpenClaw उत्तर भेजने से पहले टाइपिंग इवेंट भेजता है (सर्वोत्तम प्रयास)।
- चैनल कार्रवाइयों में `zalouser` के लिए संदेश प्रतिक्रिया कार्रवाई `react` समर्थित है।
  - किसी संदेश से विशिष्ट प्रतिक्रिया इमोजी हटाने के लिए `remove: true` का उपयोग करें।
  - प्रतिक्रिया का व्यवहार: [प्रतिक्रियाएँ](/hi/tools/reactions)
- इवेंट मेटाडेटा वाले इनबाउंड संदेशों के लिए, OpenClaw डिलीवर और देखे जाने की अभिस्वीकृतियाँ भेजता है (सर्वोत्तम प्रयास)।

## समस्या निवारण

**लॉगिन स्थायी नहीं रहता:**

- `openclaw channels status --probe`
- फिर से लॉग इन करें: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**अनुमतिसूची/समूह नाम हल नहीं हुआ:**

- `allowFrom`/`groupAllowFrom` में संख्यात्मक आईडी और `groups` में स्थायी समूह आईडी का उपयोग करें। यदि आपको जानबूझकर सटीक मित्र/समूह नामों की आवश्यकता है, तो `channels.zalouser.dangerouslyAllowNameMatching: true` सक्षम करें।

**पुराने बाहरी `zca`/CLI-आधारित सेटअप से अपग्रेड किया है:**

- बाहरी `zca` प्रक्रिया से जुड़ी सभी धारणाएँ हटाएँ; चैनल अब बिना किसी बाहरी CLI बाइनरी के, `zca-js` के माध्यम से पूरी तरह इन-प्रोसेस चलता है।

## संबंधित

- [चैनल अवलोकन](/hi/channels) - सभी समर्थित चैनल
- [पेयरिंग](/hi/channels/pairing) - DM प्रमाणीकरण और पेयरिंग प्रवाह
- [समूह](/hi/channels/groups) - समूह चैट का व्यवहार और उल्लेख गेटिंग
- [चैनल रूटिंग](/hi/channels/channel-routing) - संदेशों के लिए सत्र रूटिंग
- [सुरक्षा](/hi/gateway/security) - पहुँच मॉडल और सुदृढ़ीकरण
