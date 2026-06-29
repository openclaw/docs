---
read_when:
    - एक ही मशीन पर एक से अधिक Gateway चलाना
    - आपको प्रति Gateway अलग-थलग config/state/ports चाहिए
summary: एक ही होस्ट पर कई OpenClaw Gateways चलाएं (आइसोलेशन, पोर्ट, और प्रोफाइल)
title: एकाधिक Gateway
x-i18n:
    generated_at: "2026-06-28T23:10:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d6f6df481f6ba36749770199ef6eaf94eed33af2bed38d35a31f77b9dbba1913
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

अधिकांश सेटअप में एक ही Gateway का उपयोग करना चाहिए, क्योंकि एक Gateway कई मैसेजिंग कनेक्शन और एजेंट संभाल सकता है। यदि आपको अधिक मजबूत आइसोलेशन या रिडंडेंसी चाहिए (जैसे, रेस्क्यू बॉट), तो अलग-थलग प्रोफ़ाइल/पोर्ट के साथ अलग-अलग Gateways चलाएँ।

## सबसे अनुशंसित सेटअप

अधिकांश उपयोगकर्ताओं के लिए, सबसे सरल रेस्क्यू-बॉट सेटअप है:

- मुख्य बॉट को डिफ़ॉल्ट प्रोफ़ाइल पर रखें
- रेस्क्यू बॉट को `--profile rescue` पर चलाएँ
- रेस्क्यू खाते के लिए पूरी तरह अलग Telegram बॉट का उपयोग करें
- रेस्क्यू बॉट को `19789` जैसे किसी अलग बेस पोर्ट पर रखें

इससे रेस्क्यू बॉट मुख्य बॉट से अलग-थलग रहता है, ताकि प्राथमिक बॉट बंद होने पर वह डिबग कर सके या कॉन्फ़िगरेशन बदलाव लागू कर सके। बेस पोर्ट के बीच कम से कम 20 पोर्ट छोड़ें, ताकि व्युत्पन्न ब्राउज़र/कैनवास/CDP पोर्ट कभी टकराएँ नहीं।

## रेस्क्यू-बॉट त्वरित शुरुआत

जब तक आपके पास कुछ और करने का मजबूत कारण न हो, इसे डिफ़ॉल्ट पथ के रूप में उपयोग करें:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

यदि आपका मुख्य बॉट पहले से चल रहा है, तो आमतौर पर आपको बस यही चाहिए।

`openclaw --profile rescue onboard` के दौरान:

- अलग Telegram बॉट टोकन का उपयोग करें
- `rescue` प्रोफ़ाइल रखें
- मुख्य बॉट से कम से कम 20 अधिक बेस पोर्ट उपयोग करें
- डिफ़ॉल्ट रेस्क्यू वर्कस्पेस स्वीकार करें, जब तक कि आप पहले से स्वयं कोई प्रबंधित न कर रहे हों

यदि ऑनबोर्डिंग ने आपके लिए रेस्क्यू सेवा पहले ही इंस्टॉल कर दी है, तो अंतिम `gateway install` की आवश्यकता नहीं है।

## यह कैसे काम करता है

रेस्क्यू बॉट स्वतंत्र रहता है, क्योंकि इसका अपना होता है:

- प्रोफ़ाइल/कॉन्फ़िगरेशन
- स्टेट डायरेक्टरी
- वर्कस्पेस
- बेस पोर्ट (साथ ही व्युत्पन्न पोर्ट)
- Telegram बॉट टोकन

अधिकांश सेटअप के लिए, रेस्क्यू प्रोफ़ाइल हेतु पूरी तरह अलग Telegram बॉट का उपयोग करें:

- केवल ऑपरेटर के लिए रखना आसान
- अलग बॉट टोकन और पहचान
- मुख्य बॉट के चैनल/ऐप इंस्टॉल से स्वतंत्र
- मुख्य बॉट खराब होने पर सरल DM-आधारित रिकवरी पथ

## `--profile rescue onboard` क्या बदलता है

`openclaw --profile rescue onboard` सामान्य ऑनबोर्डिंग फ़्लो का उपयोग करता है, लेकिन यह सब कुछ एक अलग प्रोफ़ाइल में लिखता है।

व्यवहार में, इसका मतलब है कि रेस्क्यू बॉट को अपना मिलता है:

- कॉन्फ़िगरेशन फ़ाइल
- स्टेट डायरेक्टरी
- वर्कस्पेस (डिफ़ॉल्ट रूप से `~/.openclaw/workspace-rescue`)
- प्रबंधित सेवा नाम

बाकी प्रॉम्प्ट सामान्य ऑनबोर्डिंग जैसे ही होते हैं।

## सामान्य मल्टी-Gateway सेटअप

ऊपर दिया गया रेस्क्यू-बॉट लेआउट सबसे आसान डिफ़ॉल्ट है, लेकिन वही आइसोलेशन पैटर्न एक होस्ट पर Gateways के किसी भी जोड़े या समूह के लिए काम करता है।

अधिक सामान्य सेटअप के लिए, प्रत्येक अतिरिक्त Gateway को उसकी अपनी नामित प्रोफ़ाइल और अपना बेस पोर्ट दें:

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

यदि आप दोनों Gateways के लिए नामित प्रोफ़ाइल उपयोग करना चाहते हैं, तो वह भी काम करता है:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

सेवाएँ भी उसी पैटर्न का पालन करती हैं:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

जब आपको फ़ॉलबैक ऑपरेटर लेन चाहिए, तो रेस्क्यू-बॉट त्वरित शुरुआत का उपयोग करें। जब आपको अलग-अलग चैनलों, टेनेंट, वर्कस्पेस या ऑपरेशनल भूमिकाओं के लिए कई दीर्घकालिक Gateways चाहिए, तो सामान्य प्रोफ़ाइल पैटर्न का उपयोग करें।

## आइसोलेशन चेकलिस्ट

प्रत्येक Gateway इंस्टेंस के लिए इन्हें अद्वितीय रखें:

- `OPENCLAW_CONFIG_PATH` — प्रति-इंस्टेंस कॉन्फ़िगरेशन फ़ाइल
- `OPENCLAW_STATE_DIR` — प्रति-इंस्टेंस सेशन, क्रेडेंशियल, कैश
- `agents.defaults.workspace` — प्रति-इंस्टेंस वर्कस्पेस रूट
- `gateway.port` (या `--port`) — प्रति इंस्टेंस अद्वितीय
- व्युत्पन्न ब्राउज़र/कैनवास/CDP पोर्ट

यदि ये साझा हैं, तो आपको कॉन्फ़िगरेशन रेस और पोर्ट टकराव मिलेंगे।

## पोर्ट मैपिंग (व्युत्पन्न)

बेस पोर्ट = `gateway.port` (या `OPENCLAW_GATEWAY_PORT` / `--port`)।

- ब्राउज़र नियंत्रण सेवा पोर्ट = बेस + 2 (केवल loopback)
- कैनवास होस्ट Gateway HTTP सर्वर पर सर्व किया जाता है (`gateway.port` वाले ही पोर्ट पर)
- ब्राउज़र प्रोफ़ाइल CDP पोर्ट `browser.controlPort + 9 .. + 108` से अपने-आप आवंटित होते हैं

यदि आप इनमें से किसी को कॉन्फ़िगरेशन या env में ओवरराइड करते हैं, तो आपको उन्हें प्रति इंस्टेंस अद्वितीय रखना होगा।

## ब्राउज़र/CDP नोट्स (सामान्य गलती)

- कई इंस्टेंस पर `browser.cdpUrl` को समान मानों पर पिन **न करें**।
- प्रत्येक इंस्टेंस को अपना ब्राउज़र नियंत्रण पोर्ट और CDP रेंज चाहिए (उसके Gateway पोर्ट से व्युत्पन्न)।
- यदि आपको स्पष्ट CDP पोर्ट चाहिए, तो प्रति इंस्टेंस `browser.profiles.<name>.cdpPort` सेट करें।
- रिमोट Chrome: `browser.profiles.<name>.cdpUrl` का उपयोग करें (प्रति प्रोफ़ाइल, प्रति इंस्टेंस)।

## मैनुअल env उदाहरण

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## त्वरित जाँचें

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

व्याख्या:

- `gateway status --deep` पुराने इंस्टॉल से बासी launchd/systemd/schtasks सेवाओं को पकड़ने में मदद करता है।
- `gateway probe` चेतावनी टेक्स्ट, जैसे `multiple reachable gateway identities detected`, केवल तब अपेक्षित है जब आप जानबूझकर एक से अधिक अलग-थलग Gateway चला रहे हों, या जब OpenClaw यह सिद्ध नहीं कर सकता कि पहुँच योग्य प्रोब लक्ष्य वही Gateway हैं। उसी Gateway के लिए SSH टनल, प्रॉक्सी URL या कॉन्फ़िगर किया गया रिमोट URL कई ट्रांसपोर्ट वाला एक Gateway है, भले ही ट्रांसपोर्ट पोर्ट अलग हों।

## संबंधित

- [Gateway रनबुक](/hi/gateway)
- [Gateway लॉक](/hi/gateway/gateway-lock)
- [कॉन्फ़िगरेशन](/hi/gateway/configuration)
