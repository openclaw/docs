---
read_when:
    - macOS लॉग कैप्चर करना या निजी डेटा लॉगिंग की जांच करना
    - वॉइस वेक/सत्र लाइफसाइकल समस्याओं की डीबगिंग
summary: 'OpenClaw लॉगिंग: रोलिंग डायग्नोस्टिक्स फ़ाइल लॉग + एकीकृत लॉग गोपनीयता फ़्लैग'
title: macOS लॉगिंग
x-i18n:
    generated_at: "2026-06-28T23:28:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c001008311d4e3f245add4cce32bdcc3eed9d897b30f6884c0649d2f0523df
    source_path: platforms/mac/logging.md
    workflow: 16
---

# लॉगिंग (macOS)

## रोलिंग डायग्नॉस्टिक्स फ़ाइल लॉग (Debug पेन)

OpenClaw macOS ऐप लॉग को swift-log (डिफ़ॉल्ट रूप से यूनिफ़ाइड लॉगिंग) के ज़रिए रूट करता है और जब आपको टिकाऊ कैप्चर चाहिए, तो डिस्क पर स्थानीय, रोटेट होने वाला फ़ाइल लॉग लिख सकता है।

- वर्बोसिटी: **Debug पेन → लॉग्स → ऐप लॉगिंग → वर्बोसिटी**
- सक्षम करें: **Debug पेन → लॉग्स → ऐप लॉगिंग → "रोलिंग डायग्नॉस्टिक्स लॉग लिखें (JSONL)"**
- स्थान: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (स्वचालित रूप से रोटेट होता है; पुरानी फ़ाइलों में `.1`, `.2`, … प्रत्यय जोड़े जाते हैं)
- साफ़ करें: **Debug पेन → लॉग्स → ऐप लॉगिंग → "साफ़ करें"**

नोट्स:

- यह **डिफ़ॉल्ट रूप से बंद** है। केवल सक्रिय रूप से डीबग करते समय सक्षम करें।
- फ़ाइल को संवेदनशील मानें; समीक्षा के बिना इसे साझा न करें।

## macOS पर यूनिफ़ाइड लॉगिंग निजी डेटा

यूनिफ़ाइड लॉगिंग अधिकांश पेलोड को छिपा देती है, जब तक कोई सबसिस्टम `privacy -off` में ऑप्ट इन नहीं करता। macOS [लॉगिंग प्राइवेसी शेनैनिगन्स](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025) पर Peter के लेख के अनुसार, यह `/Library/Preferences/Logging/Subsystems/` में सबसिस्टम नाम से कुंजीकृत plist द्वारा नियंत्रित होता है। केवल नई लॉग एंट्रियां फ़्लैग अपनाती हैं, इसलिए किसी समस्या को पुन: उत्पन्न करने से पहले इसे सक्षम करें।

## OpenClaw (`ai.openclaw`) के लिए सक्षम करें

- plist को पहले किसी अस्थायी फ़ाइल में लिखें, फिर उसे root के रूप में एटॉमिक रूप से इंस्टॉल करें:

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

- रीबूट की आवश्यकता नहीं है; logd फ़ाइल को जल्दी नोटिस कर लेता है, लेकिन केवल नई लॉग लाइनें निजी पेलोड शामिल करेंगी।
- मौजूदा हेल्पर के साथ अधिक समृद्ध आउटपुट देखें, जैसे `./scripts/clawlog.sh --category WebChat --last 5m`।

## डीबगिंग के बाद अक्षम करें

- ओवरराइड हटाएं: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`।
- वैकल्पिक रूप से, logd को ओवरराइड तुरंत छोड़ने के लिए बाध्य करने हेतु `sudo log config --reload` चलाएं।
- याद रखें कि इस सतह में फ़ोन नंबर और संदेश बॉडी शामिल हो सकती हैं; plist को केवल तब तक रखें जब आपको सक्रिय रूप से अतिरिक्त विवरण की आवश्यकता हो।

## संबंधित

- [macOS ऐप](/hi/platforms/macos)
- [Gateway लॉगिंग](/hi/gateway/logging)
