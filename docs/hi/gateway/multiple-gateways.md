---
read_when:
    - एक ही मशीन पर एक से अधिक Gateway चलाना
    - प्रत्येक Gateway के लिए अलग-थलग कॉन्फ़िगरेशन/स्थिति/पोर्ट आवश्यक हैं
summary: एक होस्ट पर कई OpenClaw Gateways चलाएँ (आइसोलेशन, पोर्ट और प्रोफ़ाइल)
title: कई Gateway
x-i18n:
    generated_at: "2026-07-19T08:31:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 655fa865a98064d7c017a7c2eb08ea9a9683002d96a3dbe45a8c16cbd3c86ba1
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

अधिकांश सेटअप में एक Gateway की आवश्यकता होती है—एक ही Gateway कई मैसेजिंग कनेक्शन और एजेंट संभालता है। अलग-अलग प्रोफ़ाइल/पोर्ट के साथ अलग Gateway केवल तभी चलाएँ, जब आपको अधिक सुदृढ़ पृथक्करण या रिडंडेंसी की आवश्यकता हो (जैसे, बचाव बॉट)।

## बचाव बॉट का त्वरित प्रारंभ

सबसे सरल बचाव-बॉट सेटअप:

- मुख्य बॉट को डिफ़ॉल्ट प्रोफ़ाइल पर रखें।
- बचाव बॉट को `--profile rescue` पर, उसके अपने Telegram बॉट टोकन के साथ चलाएँ।
- बचाव बॉट को किसी अलग बेस पोर्ट पर रखें, जैसे `19789`।

इससे प्राथमिक बॉट के बंद होने पर भी बचाव बॉट डीबग कर सकता है या कॉन्फ़िगरेशन परिवर्तन लागू कर सकता है। बेस पोर्ट के बीच कम-से-कम 20 पोर्ट का अंतर रखें, ताकि व्युत्पन्न ब्राउज़र/CDP पोर्ट कभी न टकराएँ।

```bash
# बचाव बॉट (अलग Telegram बॉट, अलग प्रोफ़ाइल, पोर्ट 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

यदि आपका मुख्य बॉट पहले से चल रहा है, तो आम तौर पर आपको बस इतना ही करना होता है। यदि ऑनबोर्डिंग ने बचाव सेवा पहले ही इंस्टॉल कर दी है, तो अंतिम `gateway install` को छोड़ दें।

`openclaw --profile rescue onboard` के दौरान:

- बचाव खाते को समर्पित एक अलग Telegram बॉट टोकन का उपयोग करें (इसे केवल ऑपरेटर तक सीमित रखना आसान है, यह मुख्य बॉट के चैनल/ऐप इंस्टॉलेशन से स्वतंत्र रहता है और DM-आधारित पुनर्प्राप्ति का सरल मार्ग प्रदान करता है)।
- `rescue` प्रोफ़ाइल नाम बनाए रखें।
- मुख्य बॉट से कम-से-कम 20 अधिक बेस पोर्ट का उपयोग करें।
- डिफ़ॉल्ट बचाव वर्कस्पेस स्वीकार करें, जब तक कि आप पहले से स्वयं किसी वर्कस्पेस का प्रबंधन न करते हों।

### `--profile rescue onboard` क्या बदलता है

`--profile rescue onboard` सामान्य ऑनबोर्डिंग प्रवाह चलाता है, लेकिन सब कुछ एक अलग प्रोफ़ाइल में लिखता है, इसलिए बचाव बॉट को अपना अलग निम्नलिखित मिलता है:

- प्रोफ़ाइल/कॉन्फ़िगरेशन फ़ाइल
- स्थिति डायरेक्टरी
- वर्कस्पेस (डिफ़ॉल्ट: `~/.openclaw/workspace-rescue`)
- प्रबंधित सेवा का नाम
- बेस पोर्ट (साथ में व्युत्पन्न पोर्ट)
- Telegram बॉट टोकन

अन्य सभी प्रॉम्प्ट सामान्य ऑनबोर्डिंग के समान होते हैं।

## सामान्य मल्टी-Gateway सेटअप

यही पृथक्करण पैटर्न एक होस्ट पर Gateway की किसी भी जोड़ी या समूह के लिए काम करता है—प्रत्येक अतिरिक्त Gateway को उसकी अपनी नामित प्रोफ़ाइल और बेस पोर्ट दें:

```bash
# मुख्य (डिफ़ॉल्ट प्रोफ़ाइल)
openclaw setup
openclaw gateway --port 18789

# अतिरिक्त Gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

दोनों ओर नामित प्रोफ़ाइल भी काम करती हैं:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

सेवाएँ भी इसी पैटर्न का पालन करती हैं:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

फ़ॉलबैक ऑपरेटर लेन के लिए बचाव-बॉट त्वरित प्रारंभ का उपयोग करें; अलग-अलग चैनलों, टेनेंट, वर्कस्पेस या परिचालन भूमिकाओं में लंबे समय तक चलने वाले कई Gateway के लिए सामान्य प्रोफ़ाइल पैटर्न का उपयोग करें।

## पृथक्करण चेकलिस्ट

प्रत्येक Gateway इंस्टेंस के लिए इन्हें विशिष्ट रखें:

| सेटिंग                      | उद्देश्य                              |
| ---------------------------- | ------------------------------------ |
| `OPENCLAW_CONFIG_PATH`       | प्रति-इंस्टेंस कॉन्फ़िगरेशन फ़ाइल             |
| `OPENCLAW_STATE_DIR`         | प्रति-इंस्टेंस सत्र, क्रेडेंशियल और कैश |
| `agents.defaults.workspace`  | प्रति-इंस्टेंस वर्कस्पेस रूट          |
| `gateway.port` (या `--port`) | प्रत्येक इंस्टेंस के लिए विशिष्ट                  |
| व्युत्पन्न ब्राउज़र/CDP पोर्ट    | नीचे देखें                            |

इनमें से किसी को भी साझा करने से कॉन्फ़िगरेशन, स्थिति या पोर्ट में टकराव होता है। Gateway स्टार्टअप
प्रत्येक स्थिति डायरेक्टरी का विशिष्ट स्वामित्व लागू करता है, तब भी जब
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` प्रति-कॉन्फ़िगरेशन सिंगलटन को छोड़ देता है।

## पोर्ट मैपिंग (व्युत्पन्न)

बेस पोर्ट = `gateway.port` (या `OPENCLAW_GATEWAY_PORT` / `--port`)।

- ब्राउज़र नियंत्रण सेवा पोर्ट = बेस + 2 (केवल लूपबैक)।
- Canvas होस्ट स्वयं Gateway HTTP सर्वर पर उपलब्ध कराया जाता है (`gateway.port` के समान पोर्ट पर)।
- ब्राउज़र प्रोफ़ाइल CDP पोर्ट `browser control port + 9` से `+ 108` तक स्वतः आवंटित होते हैं।

कॉन्फ़िगरेशन या पर्यावरण चर में इनमें से किसी को भी ओवरराइड करने पर, आपको उन्हें प्रत्येक इंस्टेंस के लिए विशिष्ट रखना होगा।

## ब्राउज़र/CDP संबंधी नोट्स (आम गलती)

- एकाधिक इंस्टेंस में `browser.cdpUrl` को समान मान पर **पिन न करें**।
- प्रत्येक इंस्टेंस को अपने अलग ब्राउज़र नियंत्रण पोर्ट और CDP रेंज की आवश्यकता होती है (जो उसके Gateway पोर्ट से व्युत्पन्न होती है)।
- स्पष्ट CDP पोर्ट के लिए, प्रत्येक इंस्टेंस पर `browser.profiles.<name>.cdpPort` सेट करें।
- रिमोट Chrome के लिए, `browser.profiles.<name>.cdpUrl` का उपयोग करें (प्रत्येक प्रोफ़ाइल और प्रत्येक इंस्टेंस के लिए)।

## मैन्युअल पर्यावरण चर उदाहरण

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## त्वरित जाँच

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

- `gateway status --deep` पुराने इंस्टॉलेशन की निष्क्रिय launchd/systemd/schtasks सेवाओं का पता लगाता है।
- `gateway probe` चेतावनी पाठ, जैसे `multiple reachable gateway identities detected`, केवल तभी अपेक्षित है, जब आप जानबूझकर एक से अधिक पृथक Gateway चलाते हैं या जब OpenClaw यह सिद्ध नहीं कर पाता कि पहुँच योग्य जाँच लक्ष्य वही Gateway हैं। उसी Gateway के लिए SSH टनल, प्रॉक्सी URL या कॉन्फ़िगर किया गया रिमोट URL, एकाधिक ट्रांसपोर्ट वाला एक ही Gateway है, भले ही ट्रांसपोर्ट पोर्ट अलग हों।

## संबंधित

- [Gateway संचालन पुस्तिका](/hi/gateway)
- [Gateway लॉक](/hi/gateway/gateway-lock)
- [कॉन्फ़िगरेशन](/hi/gateway/configuration)
