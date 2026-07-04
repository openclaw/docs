---
read_when:
    - macOS विकास वातावरण सेट अप करना
summary: OpenClaw macOS ऐप पर काम करने वाले डेवलपरों के लिए सेटअप गाइड
title: macOS डेवलपमेंट सेटअप
x-i18n:
    generated_at: "2026-07-04T06:34:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5438de16d6d796f4c3df5d896f288ee3dfaba16471a4abb932d277cd8e8b84f8
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS डेवलपर सेटअप

स्रोत से OpenClaw macOS एप्लिकेशन बनाएं और चलाएं।

## पूर्वापेक्षाएँ

ऐप बनाने से पहले, सुनिश्चित करें कि आपके पास निम्नलिखित इंस्टॉल हैं:

1. **Xcode 26.2+**: Swift विकास के लिए आवश्यक।
2. **Node.js 24 और pnpm**: Gateway, CLI, और पैकेजिंग स्क्रिप्ट के लिए अनुशंसित। Node 22 LTS, वर्तमान में `22.19+`, संगतता के लिए समर्थित रहता है।

## 1. निर्भरताएँ इंस्टॉल करें

पूरे प्रोजेक्ट की निर्भरताएँ इंस्टॉल करें:

```bash
pnpm install
```

## 2. ऐप बनाएं और पैकेज करें

macOS ऐप बनाने और उसे `dist/OpenClaw.app` में पैकेज करने के लिए, चलाएँ:

```bash
./scripts/package-mac-app.sh
```

यदि आपके पास Apple Developer ID प्रमाणपत्र नहीं है, तो स्क्रिप्ट स्वचालित रूप से **ad-hoc signing** (`-`) का उपयोग करेगी।

डेव रन मोड, signing flags, और Team ID समस्या निवारण के लिए, macOS ऐप README देखें:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **नोट**: Ad-hoc signed ऐप्स सुरक्षा संकेत ट्रिगर कर सकते हैं। यदि ऐप "Abort trap 6" के साथ तुरंत क्रैश हो जाता है, तो [समस्या निवारण](#troubleshooting) अनुभाग देखें।

## 3. CLI और Gateway इंस्टॉल करें

पैकेज किया गया ऐप canonical `scripts/install-cli.sh` इंस्टॉलर एम्बेड करता है। किसी
नए प्रोफाइल पर, onboarding के दौरान **This Mac** चुनें; ऐप Gateway विज़ार्ड शुरू करने से पहले
मिलती-जुलती user-space CLI और runtime इंस्टॉल करता है।

मैनुअल डेवलपमेंट रिकवरी के लिए, मिलती-जुलती CLI स्वयं इंस्टॉल करें:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` और `bun add -g openclaw@<version>` भी काम करते हैं।
Gateway runtime के लिए, Node अनुशंसित पथ बना रहता है।

## समस्या निवारण

### बिल्ड विफल होता है: toolchain या SDK mismatch

macOS ऐप बिल्ड नवीनतम macOS SDK और Swift 6.2 toolchain की अपेक्षा करता है।

**सिस्टम निर्भरताएँ (आवश्यक):**

- **Software Update में उपलब्ध नवीनतम macOS संस्करण** (Xcode 26.2 SDKs द्वारा आवश्यक)
- **Xcode 26.2** (Swift 6.2 toolchain)

**जाँचें:**

```bash
xcodebuild -version
xcrun swift --version
```

यदि संस्करण मेल नहीं खाते, तो macOS/Xcode अपडेट करें और बिल्ड फिर से चलाएँ।

### अनुमति देने पर ऐप क्रैश होता है

यदि **Speech Recognition** या **Microphone** एक्सेस की अनुमति देने का प्रयास करते समय ऐप क्रैश हो जाता है, तो यह दूषित TCC cache या signature mismatch के कारण हो सकता है।

**सुधार:**

1. TCC अनुमतियाँ रीसेट करें:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. यदि यह विफल हो, तो macOS से "clean slate" बाध्य करने के लिए [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) में `BUNDLE_ID` को अस्थायी रूप से बदलें।

### Gateway "Starting..." पर अनिश्चित काल तक

यदि gateway स्थिति "Starting..." पर बनी रहती है, तो जाँचें कि कोई zombie process पोर्ट को होल्ड तो नहीं कर रहा है:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

यदि कोई manual run पोर्ट को होल्ड कर रहा है, तो उस process को रोकें (Ctrl+C)। अंतिम उपाय के रूप में, ऊपर मिली PID को kill करें।

## संबंधित

- [macOS ऐप](/hi/platforms/macos)
- [इंस्टॉल अवलोकन](/hi/install)
