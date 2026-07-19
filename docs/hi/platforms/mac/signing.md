---
read_when:
    - Mac डिबग बिल्ड बनाना या साइन करना
summary: पैकेजिंग स्क्रिप्ट द्वारा जनरेट किए गए macOS डीबग बिल्ड के लिए साइनिंग चरण
title: macOS हस्ताक्षरण
x-i18n:
    generated_at: "2026-07-19T09:35:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 406211dadc9293cf7983e75ae7dd98234f9088351234cf06c33df2f63d1b9b97
    source_path: platforms/mac/signing.md
    workflow: 16
---

# mac साइनिंग (डीबग बिल्ड)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) ऐप को एक निश्चित पथ (`dist/OpenClaw.app`) पर बिल्ड और पैकेज करता है, फिर उसे साइन करने के लिए [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) को कॉल करता है। TCC अनुमतियाँ बंडल ID और कोड सिग्नेचर से जुड़ी होती हैं; पुनः बिल्ड के दौरान दोनों को स्थिर रखने (और ऐप को एक निश्चित पथ पर रखने) से macOS, TCC अनुदानों (सूचनाएँ, ऐक्सेसिबिलिटी, स्क्रीन रिकॉर्डिंग, माइक, वाक्) को भूलता नहीं है।

- डीबग बंडल पहचानकर्ता का डिफ़ॉल्ट मान `ai.openclaw.mac.debug` है (`BUNDLE_ID=...` से ओवरराइड करें)।
- Node: `>=22.22.3 <23`, `>=24.15.0 <25`, या `>=25.9.0` (रेपो `package.json` `engines`)। पैकेजर Control UI (`pnpm ui:build`) भी बिल्ड करता है।
- डिफ़ॉल्ट रूप से वास्तविक साइनिंग पहचान आवश्यक है; यदि कोई पहचान नहीं मिलती और `ALLOW_ADHOC_SIGNING` सेट नहीं है, तो codesign स्क्रिप्ट त्रुटि के साथ बंद हो जाती है। ऐड-हॉक साइनिंग (`SIGN_IDENTITY="-"`) के लिए स्पष्ट रूप से ऑप्ट-इन करना पड़ता है और यह पुनः बिल्ड के दौरान TCC अनुमतियों को कायम नहीं रखती। [macOS अनुमतियाँ](/hi/platforms/mac/permissions) देखें।
- परिवेश से `SIGN_IDENTITY` पढ़ता है (उदाहरण के लिए `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"`, या Developer ID Application प्रमाणपत्र)। इसके बिना, `codesign-mac-app.sh` इस क्रम में स्वतः पहचान चुनता है: Developer ID Application, Apple Distribution, Apple Development, फिर मिलने वाली पहली मान्य कोड-साइनिंग पहचान।
- `CODESIGN_TIMESTAMP=auto` (डिफ़ॉल्ट) केवल Developer ID Application सिग्नेचर के लिए विश्वसनीय टाइमस्टैम्प सक्षम करता है। किसी भी स्थिति को बाध्य करने के लिए `on`/`off` सेट करें।
- Info.plist पर `OpenClawBuildTimestamp` (ISO8601 UTC) और `OpenClawGitCommit` (छोटा हैश, उपलब्ध न होने पर `unknown`) अंकित करता है, ताकि परिचय टैब बिल्ड, git और डीबग/रिलीज़ चैनल दिखा सके।
- साइनिंग के बाद Team ID ऑडिट चलाता है और यदि बंडल के भीतर किसी Mach-O की Team ID अलग हो, तो विफल हो जाता है। इसे बायपास करने के लिए `SKIP_TEAM_ID_CHECK=1` सेट करें।

## उपयोग

```bash
# रेपो रूट से
scripts/package-mac-app.sh                                                      # पहचान स्वतः चुनता है; कोई न मिलने पर त्रुटि
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # वास्तविक प्रमाणपत्र
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # ऐड-हॉक (अनुमतियाँ कायम नहीं रहेंगी)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # स्पष्ट ऐड-हॉक (वही सावधानी)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # केवल डेवलपमेंट के लिए Sparkle Team ID बेमेल का समाधान
```

### ऐड-हॉक साइनिंग संबंधी टिप्पणी

`SIGN_IDENTITY="-"`, Hardened Runtime (`--options runtime`) को अक्षम करता है, ताकि ऐप द्वारा समान Team ID साझा न करने वाले एम्बेडेड फ़्रेमवर्क (जैसे Sparkle) लोड करने पर क्रैश न हो। ऐड-हॉक सिग्नेचर TCC अनुमति की स्थिरता भी समाप्त कर देते हैं; पुनर्प्राप्ति के चरणों के लिए [macOS अनुमतियाँ](/hi/platforms/mac/permissions) देखें।

## परिचय के लिए बिल्ड मेटाडेटा

परिचय टैब, संस्करण, बिल्ड की तारीख, git कमिट और बिल्ड के DEBUG होने की स्थिति (`#if DEBUG` के माध्यम से) दिखाने के लिए Info.plist से `OpenClawBuildTimestamp` और `OpenClawGitCommit` पढ़ता है। इन मानों को रीफ़्रेश करने के लिए कोड में बदलाव के बाद पैकेजर को फिर से चलाएँ।

## संबंधित

- [macOS ऐप](/hi/platforms/macos)
- [macOS अनुमतियाँ](/hi/platforms/mac/permissions)
