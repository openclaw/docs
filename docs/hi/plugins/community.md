---
doc-schema-version: 1
read_when:
    - आप तृतीय-पक्ष OpenClaw Plugin ढूँढना चाहते हैं
    - आप अपना Plugin ClawHub पर प्रकाशित या सूचीबद्ध करना चाहते हैं
summary: समुदाय-प्रबंधित OpenClaw plugins खोजें और प्रकाशित करें
title: सामुदायिक Plugin
x-i18n:
    generated_at: "2026-06-28T23:34:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ecf059fa0c32f09d09381b2153a6a63ca522d49719aaa8476209389a6b5b36a
    source_path: plugins/community.md
    workflow: 16
---

कम्युनिटी Plugin तृतीय-पक्ष पैकेज होते हैं जो OpenClaw को चैनलों,
टूल, प्रोवाइडरों, हुक या अन्य क्षमताओं से विस्तारित करते हैं। सार्वजनिक कम्युनिटी Plugin के लिए
प्राथमिक खोज सतह के रूप में [ClawHub](/hi/clawhub) का उपयोग करें।

## Plugin खोजें

CLI से ClawHub खोजें:

```bash
openclaw plugins search "calendar"
```

स्पष्ट स्रोत प्रीफ़िक्स के साथ ClawHub Plugin इंस्टॉल करें:

```bash
openclaw plugins install clawhub:<package-name>
```

लॉन्च कटओवर के दौरान npm समर्थित डायरेक्ट-इंस्टॉल पथ बना रहता है:

```bash
openclaw plugins install npm:<package-name>
```

सामान्य इंस्टॉल, अपडेट, निरीक्षण और अनइंस्टॉल उदाहरणों के लिए
[Plugin प्रबंधित करें](/hi/plugins/manage-plugins) का उपयोग करें। पूर्ण कमांड संदर्भ और
स्रोत-चयन नियमों के लिए [`openclaw plugins`](/hi/cli/plugins) का उपयोग करें।

## Plugin प्रकाशित करें

जब आप चाहते हैं कि OpenClaw उपयोगकर्ता सार्वजनिक कम्युनिटी Plugin खोज और इंस्टॉल कर सकें,
तो उन्हें ClawHub पर प्रकाशित करें। ClawHub लाइव पैकेज सूची, रिलीज़ इतिहास,
स्कैन स्थिति और इंस्टॉल संकेतों का स्वामी है; दस्तावेज़ स्थिर तृतीय-पक्ष
Plugin कैटलॉग बनाए नहीं रखते।

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

प्रकाशित करने से पहले, सुनिश्चित करें कि Plugin में पैकेज मेटाडेटा, Plugin मैनिफ़ेस्ट,
सेटअप दस्तावेज़ और स्पष्ट मेंटेनेंस स्वामी है। ClawHub रिलीज़ बनाने से पहले
स्वामी स्कोप, पैकेज नाम, संस्करण, फ़ाइल सीमाओं और स्रोत मेटाडेटा की पुष्टि करता है,
फिर समीक्षा और सत्यापन पूरा होने तक नई रिलीज़ को सामान्य इंस्टॉल और डाउनलोड
सतहों से छिपाए रखता है।

प्रकाशित करने से पहले इस चेकलिस्ट का उपयोग करें:

| आवश्यकता              | क्यों                                               |
| --------------------- | --------------------------------------------------- |
| ClawHub पर प्रकाशित   | उपयोगकर्ताओं को `openclaw plugins install` संकेत काम करने चाहिए |
| सार्वजनिक GitHub रेपो | स्रोत समीक्षा, समस्या ट्रैकिंग, पारदर्शिता          |
| सेटअप और उपयोग दस्तावेज़ | उपयोगकर्ताओं को यह जानना चाहिए कि इसे कैसे कॉन्फ़िगर करना है |
| सक्रिय मेंटेनेंस      | हालिया अपडेट या उत्तरदायी समस्या हैंडलिंग          |

पूर्ण प्रकाशन अनुबंध के लिए इन पेजों का उपयोग करें:

- [ClawHub प्रकाशन](/hi/clawhub/publishing) स्वामियों, स्कोप, रिलीज़,
  समीक्षा, पैकेज सत्यापन और पैकेज ट्रांसफ़र को समझाता है।
- [Plugin बनाना](/hi/plugins/building-plugins) Plugin पैकेज का आकार
  और पहला प्रकाशन वर्कफ़्लो दिखाता है।
- [Plugin मैनिफ़ेस्ट](/hi/plugins/manifest) नेटिव Plugin मैनिफ़ेस्ट फ़ील्ड परिभाषित करता है।

## संबंधित

- [Plugin](/hi/tools/plugin) - इंस्टॉल, कॉन्फ़िगर, रीस्टार्ट और समस्या-निवारण
- [Plugin प्रबंधित करें](/hi/plugins/manage-plugins) - कमांड उदाहरण
- [ClawHub प्रकाशन](/hi/clawhub/publishing) - प्रकाशित और रिलीज़ नियम
