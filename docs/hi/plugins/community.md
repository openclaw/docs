---
doc-schema-version: 1
read_when:
    - आप तृतीय-पक्ष OpenClaw plugins खोजना चाहते हैं
    - आप ClawHub पर अपना Plugin प्रकाशित या सूचीबद्ध करना चाहते हैं
summary: समुदाय द्वारा अनुरक्षित OpenClaw plugins खोजें और प्रकाशित करें
title: सामुदायिक Plugins
x-i18n:
    generated_at: "2026-07-16T15:58:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6a9eb477f20da8171a35c22ea6b112d77ff4afe0878f60314c052746aef4e0ac
    source_path: plugins/community.md
    workflow: 16
---

सामुदायिक plugins तृतीय-पक्ष पैकेज हैं जो OpenClaw में
चैनल, टूल, प्रदाता, हुक या अन्य क्षमताएँ जोड़ते हैं। सार्वजनिक सामुदायिक
plugins खोजने के लिए प्राथमिक माध्यम के रूप में [ClawHub](/clawhub) का उपयोग करें।

## Plugins खोजें

CLI से ClawHub में खोजें:

```bash
openclaw plugins search "calendar"
```

स्पष्ट स्रोत प्रीफ़िक्स के साथ ClawHub plugin इंस्टॉल करें:

```bash
openclaw plugins install clawhub:<package-name>
```

लॉन्च परिवर्तन के दौरान npm प्रत्यक्ष इंस्टॉलेशन का समर्थित तरीका बना रहेगा:

```bash
openclaw plugins install npm:<package-name>
```

इंस्टॉल, अपडेट, निरीक्षण और अनइंस्टॉल के सामान्य उदाहरणों के लिए
[Plugins प्रबंधित करें](/hi/plugins/manage-plugins) का उपयोग करें। संपूर्ण कमांड संदर्भ
और स्रोत-चयन नियमों के लिए [`openclaw plugins`](/hi/cli/plugins) का उपयोग करें।

## Plugins प्रकाशित करें

सार्वजनिक सामुदायिक plugins को ClawHub पर प्रकाशित करें, ताकि OpenClaw उपयोगकर्ता
उन्हें खोज और इंस्टॉल कर सकें। ClawHub लाइव पैकेज सूची, रिलीज़ इतिहास,
स्कैन स्थिति और इंस्टॉलेशन संकेतों का प्रबंधन करता है; दस्तावेज़ स्थिर
तृतीय-पक्ष plugin कैटलॉग का रखरखाव नहीं करते।

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

प्रकाशित करने से पहले सुनिश्चित करें कि plugin में पैकेज मेटाडेटा, plugin
मैनिफ़ेस्ट, सेटअप दस्तावेज़ और स्पष्ट रखरखाव स्वामी हो। ClawHub रिलीज़
बनाने से पहले स्वामी का स्कोप, पैकेज नाम, संस्करण, फ़ाइल सीमाएँ और स्रोत
मेटाडेटा सत्यापित करता है, फिर समीक्षा और सत्यापन पूरा होने तक नई रिलीज़ को
सामान्य इंस्टॉलेशन और डाउनलोड माध्यमों से छिपाकर रखता है।

प्रकाशित करने से पहले जाँच-सूची:

| आवश्यकता             | कारण                                                |
| -------------------- | --------------------------------------------------- |
| ClawHub पर प्रकाशित  | उपयोगकर्ताओं के लिए `openclaw plugins install` संकेतों का काम करना आवश्यक है |
| सार्वजनिक GitHub रिपॉज़िटरी | स्रोत समीक्षा, समस्या ट्रैकिंग, पारदर्शिता      |
| सेटअप और उपयोग दस्तावेज़ | उपयोगकर्ताओं को इसे कॉन्फ़िगर करने का तरीका पता होना चाहिए |
| सक्रिय रखरखाव        | हाल के अपडेट या समस्याओं पर तत्पर कार्रवाई         |

संपूर्ण प्रकाशन अनुबंध:

- [ClawHub प्रकाशन](/hi/clawhub/publishing) - स्वामी, स्कोप, रिलीज़,
  समीक्षा, पैकेज सत्यापन और पैकेज हस्तांतरण
- [Plugins बनाना](/hi/plugins/building-plugins) - plugin पैकेज की संरचना
  और प्रथम प्रकाशन कार्यप्रवाह
- [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest) - मूल plugin मैनिफ़ेस्ट फ़ील्ड

## संबंधित

- [Plugins](/hi/tools/plugin) - इंस्टॉल, कॉन्फ़िगर, रीस्टार्ट और समस्या निवारण
- [Plugins प्रबंधित करें](/hi/plugins/manage-plugins) - कमांड के उदाहरण
- [ClawHub प्रकाशन](/hi/clawhub/publishing) - प्रकाशन और रिलीज़ नियम
