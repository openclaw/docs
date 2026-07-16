---
read_when:
    - macOS लॉग कैप्चर करना या निजी डेटा की लॉगिंग की जाँच करना
    - वॉइस वेक/सेशन जीवनचक्र संबंधी समस्याओं की डीबगिंग
summary: 'OpenClaw लॉगिंग: रोटेटिंग डायग्नोस्टिक्स फ़ाइल लॉग + एकीकृत लॉग गोपनीयता फ़्लैग'
title: macOS लॉगिंग
x-i18n:
    generated_at: "2026-07-16T15:46:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# लॉगिंग (macOS)

## रोटेट होने वाली डायग्नोस्टिक्स फ़ाइल लॉग (Debug पेन)

macOS ऐप swift-log के माध्यम से लॉग करता है (डिफ़ॉल्ट रूप से यूनिफ़ाइड लॉगिंग) और स्थायी कैप्चर के लिए रोटेट होने वाली स्थानीय फ़ाइल लॉग में भी लिख सकता है (`DiagnosticsFileLog`)।

- सक्षम करें: **Debug pane -> Logs -> App logging -> "Write rolling diagnostics log (JSONL)"** (डिफ़ॉल्ट रूप से बंद)।
- विस्तार स्तर: **Debug pane -> Logs -> App logging -> Verbosity** पिकर।
- स्थान: `~/Library/Logs/OpenClaw/diagnostics.jsonl`।
- रोटेशन: 5 MB पर रोटेट होता है; `.1`...`.5` प्रत्यय वाले अधिकतम 5 बैकअप (सबसे पुराना हटा दिया जाता है)।
- साफ़ करें: **Debug pane -> Logs -> App logging -> "Clear"** सक्रिय फ़ाइल और सभी बैकअप मिटाता है।

फ़ाइल को संवेदनशील मानें; समीक्षा किए बिना इसे साझा न करें।

## macOS पर यूनिफ़ाइड लॉगिंग का निजी डेटा

जब तक कोई सबसिस्टम `privacy -off` को स्पष्ट रूप से सक्षम नहीं करता, यूनिफ़ाइड लॉगिंग अधिकांश पेलोड को संशोधित करके छिपा देती है। इसे `/Library/Preferences/Logging/Subsystems/` में मौजूद plist द्वारा नियंत्रित किया जाता है, जिसकी कुंजी सबसिस्टम का नाम होती है। केवल नई लॉग प्रविष्टियाँ इस फ़्लैग को अपनाती हैं, इसलिए किसी समस्या को पुनः उत्पन्न करने से पहले इसे सक्षम करें। पृष्ठभूमि: [macOS लॉगिंग की गोपनीयता संबंधी पेचीदगियाँ](https://steipete.me/posts/2025/logging-privacy-shenanigans)।

## OpenClaw के लिए सक्षम करें (`ai.openclaw`)

पहले plist को किसी अस्थायी फ़ाइल में लिखें, फिर इसे root के रूप में परमाण्विक ढंग से इंस्टॉल करें:

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

रीबूट की आवश्यकता नहीं है; logd फ़ाइल को शीघ्रता से अपना लेता है, लेकिन केवल नई लॉग पंक्तियों में निजी पेलोड शामिल होते हैं। अधिक विस्तृत आउटपुट `./scripts/clawlog.sh --category WebChat --last 5m` से देखें (`--last`/`-l` समय-सीमा निर्धारित करता है, डिफ़ॉल्ट `5m`; `--category`/`-c` श्रेणी के अनुसार फ़िल्टर करता है)।

## डीबगिंग के बाद अक्षम करें

- ओवरराइड हटाएँ: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`।
- logd को ओवरराइड तुरंत हटाने के लिए वैकल्पिक रूप से `sudo log config --reload` चलाएँ।
- इस सतह में फ़ोन नंबर और संदेशों का मुख्य भाग शामिल हो सकता है; plist को केवल सक्रिय आवश्यकता के दौरान ही बनाए रखें।

## संबंधित

- [macOS ऐप](/hi/platforms/macos)
- [Gateway लॉगिंग](/hi/gateway/logging)
