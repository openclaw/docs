---
read_when:
    - स्थानीय रूप से पैक किए गए Plugin के साथ ऑनबोर्डिंग या सेटअप प्रवाहों का परीक्षण करना
    - किसी Plugin पैकेज को प्रकाशित करने से पहले उसका सत्यापन करना
    - स्वचालित Plugin इंस्टॉल को परीक्षण आर्टिफ़ैक्ट से बदलना
sidebarTitle: Install overrides
summary: सेटअप-समय की इंस्टॉल प्रक्रियाओं के साथ पैकेज किए गए Plugin ओवरराइड का परीक्षण करें
title: Plugin इंस्टॉल ओवरराइड्स
x-i18n:
    generated_at: "2026-07-16T16:04:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: adc823f49ea9f8fa86e6a89933e43fdc309d808ac24397770495dbe81cb4b0d7
    source_path: plugins/install-overrides.md
    workflow: 16
---

Plugin इंस्टॉल ओवरराइड अनुरक्षकों को सेटअप के समय होने वाले Plugin इंस्टॉल को कैटलॉग,
बंडल किए गए या डिफ़ॉल्ट npm स्रोत के बजाय किसी विशिष्ट npm पैकेज या स्थानीय npm-pack टारबॉल की ओर इंगित करने देते हैं।
वे केवल E2E और पैकेज सत्यापन के लिए उपलब्ध हैं; सामान्य उपयोगकर्ता Plugin को
[`openclaw plugins install`](/hi/cli/plugins) से इंस्टॉल करते हैं।

<Warning>
ओवरराइड आपके दिए गए स्रोत से Plugin कोड निष्पादित करते हैं। उनका उपयोग केवल
पृथक स्टेट डायरेक्टरी या अस्थायी परीक्षण मशीन में करें।
</Warning>

## एनवायरनमेंट

जब तक दोनों वेरिएबल सेट न हों, ओवरराइड अक्षम रहते हैं:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

ओवरराइड मैप JSON है, जिसकी कुंजियाँ Plugin id हैं। मान इनका समर्थन करते हैं:

| प्रीफ़िक्स                | स्रोत                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `npm:<registry-spec>` | रजिस्ट्री पैकेज, सटीक संस्करण या टैग                                                       |
| `npm-pack:<path.tgz>` | `npm pack` द्वारा बनाए गए स्थानीय टारबॉल; सापेक्ष पाथ वर्तमान कार्यशील डायरेक्टरी से रिज़ॉल्व होते हैं |

## व्यवहार

जब सेटअप के समय का कोई फ़्लो ऐसे Plugin को इंस्टॉल करता है जिसकी id मैप में मौजूद है, तो OpenClaw
कैटलॉग, बंडल किए गए या डिफ़ॉल्ट npm स्रोत के बजाय ओवरराइड स्रोत का
उपयोग करता है। यह ऑनबोर्डिंग और साझा सेटअप-समय Plugin इंस्टॉलर का उपयोग करने वाले
किसी भी अन्य फ़्लो पर लागू होता है।

- ओवरराइड फिर भी अपेक्षित Plugin id लागू करते हैं: `codex` से मैप किया गया टारबॉल
  ऐसा Plugin इंस्टॉल करना चाहिए जिसकी मैनिफ़ेस्ट id `codex` हो।
- ओवरराइड आधिकारिक विश्वसनीय-स्रोत स्थिति इनहेरिट नहीं करते। भले ही
  कैटलॉग प्रविष्टि सामान्यतः OpenClaw के स्वामित्व वाला पैकेज दर्शाती हो, ओवरराइड को
  ऑपरेटर द्वारा दिए गए परीक्षण इनपुट के रूप में माना जाता है।
- वर्कस्पेस की `.env` फ़ाइलें इंस्टॉल ओवरराइड सक्षम नहीं कर सकतीं; दोनों एनवायरनमेंट वेरिएबल
  ब्लॉक की गई वर्कस्पेस dotenv सूची में हैं। इन्हें उस विश्वसनीय शेल, CI जॉब या
  रिमोट परीक्षण कमांड में सेट करें जो OpenClaw लॉन्च करता है।

## पैकेज E2E

पृथक स्टेट डायरेक्टरी का उपयोग करें, ताकि पैकेज इंस्टॉल और इंस्टॉल रिकॉर्ड
आपकी सामान्य OpenClaw स्टेट को प्रभावित न करें:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

स्टेट डायरेक्टरी के अंतर्गत इंस्टॉल किए गए पैकेज को सत्यापित करें:

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

लाइव प्रोवाइडर E2E के लिए, परीक्षण कमांड लॉन्च करने से पहले वास्तविक API कुंजी को
किसी विश्वसनीय शेल या CI सीक्रेट से स्रोत करें। कुंजियाँ प्रिंट न करें; केवल स्रोत और
कुंजी मौजूद थी या नहीं, इसकी रिपोर्ट दें।
