---
read_when:
    - macOS डेवलपमेंट परिवेश सेट अप करना
summary: OpenClaw macOS ऐप पर काम करने वाले डेवलपरों के लिए सेटअप गाइड
title: macOS डेवलपमेंट सेटअप
x-i18n:
    generated_at: "2026-07-16T15:46:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ff72bb449e70b94b8a13504414955ab7fe411a674b65e670939484a5863b5f48
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# macOS डेवलपर सेटअप

OpenClaw macOS एप्लिकेशन को स्रोत से बिल्ड और चलाएँ।

## पूर्वापेक्षाएँ

- **Xcode 26.2+** (Swift 6.2 टूलचेन), Software Update में उपलब्ध नवीनतम macOS पर।
- Gateway, CLI और पैकेजिंग स्क्रिप्ट के लिए **Node.js 24.15+ और pnpm**। Node
  22.22.3+ भी काम करता है।

## 1. निर्भरताएँ इंस्टॉल करें

```bash
pnpm install
```

## 2. ऐप को बिल्ड और पैकेज करें

```bash
./scripts/package-mac-app.sh
```

यह `dist/OpenClaw.app` आउटपुट करता है। Apple Developer ID प्रमाणपत्र के बिना,
स्क्रिप्ट तदर्थ साइनिंग का उपयोग करती है।

डेवलपमेंट रन मोड, साइनिंग फ़्लैग और Team ID की समस्या निवारण के लिए
[apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md) देखें।
रिपॉज़िटरी रूट से तेज़ डेवलपमेंट लूप: `scripts/restart-mac.sh` (तदर्थ साइनिंग के लिए
`--no-sign` जोड़ें; `--no-sign` के साथ TCC अनुमतियाँ बनी नहीं रहतीं)।

<Note>
तदर्थ रूप से साइन किए गए ऐप सुरक्षा प्रॉम्प्ट दिखा सकते हैं। यदि ऐप
"Abort trap 6" के साथ तुरंत क्रैश हो जाता है, तो [समस्या निवारण](#troubleshooting) देखें।
</Note>

## 3. CLI और Gateway इंस्टॉल करें

पैकेज किया गया ऐप मानक `scripts/install-cli.sh` इंस्टॉलर को एम्बेड करता है। किसी
नए प्रोफ़ाइल पर, ऑनबोर्डिंग के दौरान **This Mac** चुनें; Gateway विज़ार्ड शुरू करने से
पहले ऐप मेल खाने वाले यूज़र-स्पेस CLI और रनटाइम को इंस्टॉल करता है।

मैन्युअल डेवलपमेंट पुनर्प्राप्ति के लिए, मेल खाने वाला CLI स्वयं इंस्टॉल करें:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` और `bun add -g openclaw@<version>` भी
काम करते हैं। Gateway के लिए Node अब भी अनुशंसित रनटाइम है।

## समस्या निवारण

### बिल्ड विफलता: टूलचेन या SDK बेमेल

macOS ऐप बिल्ड के लिए नवीनतम macOS SDK और Swift 6.2 टूलचेन
(Xcode 26.2+) आवश्यक हैं।

```bash
xcodebuild -version
xcrun swift --version
```

यदि संस्करण मेल नहीं खाते, तो macOS/Xcode को अपडेट करके बिल्ड फिर से चलाएँ।

### अनुमति देते समय ऐप क्रैश होना

यदि **Speech Recognition** या **Microphone** एक्सेस की अनुमति देने का प्रयास करते समय
ऐप क्रैश हो जाता है, तो इसका कारण दूषित TCC कैश या हस्ताक्षर बेमेल हो सकता है।

1. डीबग बंडल आईडी के लिए TCC अनुमतियाँ रीसेट करें:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. यदि यह विफल होता है, तो macOS से पूरी तरह नई शुरुआत करवाने के लिए
   [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh)
   में `BUNDLE_ID` को अस्थायी रूप से बदलें।

### Gateway अनिश्चित काल तक "Starting..." दिखाता है

जाँचें कि कोई ज़ॉम्बी प्रक्रिया पोर्ट को उपयोग में तो नहीं रखे हुए है:

```bash
openclaw gateway status
openclaw gateway stop

# यदि आप LaunchAgent का उपयोग नहीं कर रहे हैं (डेवलपमेंट मोड / मैन्युअल रन), तो लिसनर खोजें:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

यदि कोई मैन्युअल रन पोर्ट को उपयोग में रखे हुए है, तो उसे रोकें (Ctrl+C), या अंतिम
उपाय के रूप में ऊपर मिली PID को समाप्त करें।

## संबंधित

- [macOS ऐप](/hi/platforms/macos)
- [इंस्टॉलेशन का अवलोकन](/hi/install)
