---
read_when:
    - macOS विकास परिवेश सेट करना
summary: OpenClaw macOS ऐप पर काम करने वाले डेवलपर्स के लिए सेटअप गाइड
title: macOS डेवलपर सेटअप
x-i18n:
    generated_at: "2026-06-28T23:28:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 09212c9b9139dd19867b9286dc43361794a3efd37b2a8d769bb0a8fdd389b816
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS डेवलपर सेटअप

स्रोत से OpenClaw macOS ऐप्लिकेशन बनाएं और चलाएं।

## पूर्वापेक्षाएं

ऐप बनाने से पहले, सुनिश्चित करें कि आपके पास निम्न इंस्टॉल हैं:

1. **Xcode 26.2+**: Swift विकास के लिए आवश्यक।
2. **Node.js 24 और pnpm**: Gateway, CLI, और पैकेजिंग स्क्रिप्ट के लिए अनुशंसित। Node 22 LTS, वर्तमान में `22.19+`, संगतता के लिए समर्थित है।

## 1. निर्भरताएं इंस्टॉल करें

पूरे प्रोजेक्ट की निर्भरताएं इंस्टॉल करें:

```bash
pnpm install
```

## 2. ऐप बनाएं और पैकेज करें

macOS ऐप बनाने और उसे `dist/OpenClaw.app` में पैकेज करने के लिए, चलाएं:

```bash
./scripts/package-mac-app.sh
```

यदि आपके पास Apple Developer ID प्रमाणपत्र नहीं है, तो स्क्रिप्ट अपने-आप **एड-हॉक साइनिंग** (`-`) का उपयोग करेगी।

डेव रन मोड, साइनिंग फ़्लैग, और Team ID समस्या-निवारण के लिए, macOS ऐप README देखें:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **नोट**: एड-हॉक साइन किए गए ऐप सुरक्षा संकेत दिखा सकते हैं। यदि ऐप "Abort trap 6" के साथ तुरंत क्रैश हो जाता है, तो [समस्या-निवारण](#troubleshooting) अनुभाग देखें।

## 3. CLI इंस्टॉल करें

macOS ऐप पृष्ठभूमि कार्यों को प्रबंधित करने के लिए वैश्विक `openclaw` CLI इंस्टॉल की अपेक्षा करता है।

**इसे इंस्टॉल करने के लिए (अनुशंसित):**

1. OpenClaw ऐप खोलें।
2. **सामान्य** सेटिंग टैब पर जाएं।
3. **"CLI इंस्टॉल करें"** पर क्लिक करें।

वैकल्पिक रूप से, इसे मैन्युअल रूप से इंस्टॉल करें:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` और `bun add -g openclaw@<version>` भी काम करते हैं।
Gateway रनटाइम के लिए, Node अनुशंसित मार्ग बना रहता है।

## समस्या-निवारण

### बिल्ड विफल: टूलचेन या SDK मेल नहीं खाता

macOS ऐप बिल्ड नवीनतम macOS SDK और Swift 6.2 टूलचेन की अपेक्षा करता है।

**सिस्टम निर्भरताएं (आवश्यक):**

- **सॉफ़्टवेयर अपडेट में उपलब्ध नवीनतम macOS संस्करण** (Xcode 26.2 SDKs द्वारा आवश्यक)
- **Xcode 26.2** (Swift 6.2 टूलचेन)

**जांचें:**

```bash
xcodebuild -version
xcrun swift --version
```

यदि संस्करण मेल नहीं खाते, तो macOS/Xcode अपडेट करें और बिल्ड फिर से चलाएं।

### अनुमति देने पर ऐप क्रैश होता है

यदि **Speech Recognition** या **Microphone** एक्सेस की अनुमति देने की कोशिश करते समय ऐप क्रैश होता है, तो यह दूषित TCC कैश या हस्ताक्षर मेल न खाने के कारण हो सकता है।

**सुधार:**

1. TCC अनुमतियां रीसेट करें:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. यदि वह विफल होता है, तो macOS से "साफ़ शुरुआत" मजबूर करने के लिए [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) में `BUNDLE_ID` को अस्थायी रूप से बदलें।

### Gateway "शुरू हो रहा है..." अनिश्चित काल तक

यदि Gateway स्थिति "शुरू हो रहा है..." पर बनी रहती है, तो जांचें कि क्या कोई ज़ॉम्बी प्रोसेस पोर्ट पकड़े हुए है:

```bash
openclaw gateway status
openclaw gateway stop

# यदि आप LaunchAgent (डेव मोड / मैन्युअल रन) का उपयोग नहीं कर रहे हैं, तो listener खोजें:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

यदि कोई मैन्युअल रन पोर्ट पकड़े हुए है, तो उस प्रोसेस को रोकें (Ctrl+C)। अंतिम उपाय के रूप में, ऊपर मिला PID समाप्त करें।

## संबंधित

- [macOS ऐप](/hi/platforms/macos)
- [इंस्टॉल अवलोकन](/hi/install)
