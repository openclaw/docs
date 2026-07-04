---
read_when:
    - OpenClaw.app को पैकेज करना
    - macOS Gateway launchd सेवा की डीबगिंग
    - macOS के लिए Gateway CLI इंस्टॉल करना
summary: macOS पर Gateway रनटाइम (बाहरी launchd सेवा)
title: macOS पर Gateway
x-i18n:
    generated_at: "2026-07-04T06:36:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8b646f4cae43cb66acbf3527ef2af9ccaf4b6f2678a464586a110e5e9b3662
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app अब Node/Bun या Gateway रनटाइम को बंडल नहीं करता। macOS ऐप
**बाहरी** `openclaw` CLI इंस्टॉल की अपेक्षा करता है, Gateway को चाइल्ड
प्रक्रिया के रूप में शुरू नहीं करता, और Gateway को चालू रखने के लिए प्रति-उपयोगकर्ता launchd सेवा प्रबंधित करता है
(या यदि कोई स्थानीय Gateway पहले से चल रहा है, तो उससे जुड़ जाता है)।

## स्वचालित सेटअप

नए Mac पर, ऑनबोर्डिंग के दौरान **यह Mac** चुनें। ऐप Gateway विज़र्ड से पहले अपना हस्ताक्षरित,
बंडल किया गया इंस्टॉलर चलाता है, `~/.openclaw` के अंतर्गत यूज़र-स्पेस Node रनटाइम
और मेल खाता `openclaw` CLI इंस्टॉल करता है, फिर प्रति-उपयोगकर्ता launchd सेवा इंस्टॉल और शुरू करता है। इस पथ के लिए Terminal, Homebrew, या
प्रशासक एक्सेस की आवश्यकता नहीं होती।

ऐप इंस्टॉलर स्क्रिप्ट को बंडल करता है, Node या Gateway पेलोड को नहीं। इसलिए सेटअप
को रनटाइम और मेल खाते OpenClaw पैकेज को डाउनलोड करने के लिए इंटरनेट कनेक्शन चाहिए।

## मैनुअल रिकवरी

मैनुअल इंस्टॉल के लिए Node 24 अनुशंसित है। Node 22 LTS, वर्तमान में `22.19+`,
भी काम करता है। फिर `openclaw` को वैश्विक रूप से इंस्टॉल करें:

```bash
npm install -g openclaw@<version>
```

असफल स्वचालित सेटअप के बाद **सेटअप फिर से आज़माएँ** का उपयोग करें। यदि वह अभी भी विफल हो, तो
ऊपर दिए गए कमांड से CLI को मैनुअल रूप से इंस्टॉल करें, फिर ऑनबोर्डिंग में **फिर से जाँचें** चुनें।
Node अनुशंसित Gateway रनटाइम बना रहता है।

## Launchd (LaunchAgent के रूप में Gateway)

लेबल:

- `ai.openclaw.gateway` (या `ai.openclaw.<profile>`; लेगेसी `com.openclaw.*` रह सकता है)

Plist स्थान (प्रति-उपयोगकर्ता):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (या `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

मैनेजर:

- macOS ऐप Local मोड में LaunchAgent इंस्टॉल/अपडेट का स्वामी है।
- CLI भी इसे इंस्टॉल कर सकता है: `openclaw gateway install`।

व्यवहार:

- "OpenClaw Active" LaunchAgent को सक्षम/अक्षम करता है।
- ऐप छोड़ना gateway को बंद नहीं करता (launchd इसे चालू रखता है)।
- यदि कॉन्फ़िगर किए गए पोर्ट पर Gateway पहले से चल रहा है, तो ऐप नया शुरू करने के बजाय
  उससे जुड़ जाता है।

लॉगिंग:

- launchd stdout: `~/Library/Logs/openclaw/gateway.log` (प्रोफ़ाइल `gateway-<profile>.log` का उपयोग करते हैं)
- launchd stderr: दबाया गया

## संस्करण संगतता

macOS ऐप Gateway संस्करण की जाँच अपने संस्करण के विरुद्ध करता है। जब मौजूदा CLI अनुपस्थित या
असंगत हो, तो ऑनबोर्डिंग स्वचालित रूप से प्रबंधित सेटअप चलाती है। इंस्टॉलेशन दोहराने के लिए **सेटअप फिर से आज़माएँ** या बाहरी CLI को सुधारने के बाद **फिर से जाँचें**
का उपयोग करें।

## macOS पर स्टेट डायरेक्टरी

OpenClaw स्टेट को स्थानीय, नॉन-सिंक्ड डिस्क पर रखें। iCloud Drive और अन्य
क्लाउड-सिंक्ड फ़ोल्डरों से बचें, क्योंकि सिंक विलंबता और फ़ाइल लॉक सत्रों,
क्रेडेंशियल्स, और Gateway स्टेट को प्रभावित कर सकते हैं।

`OPENCLAW_STATE_DIR` को स्थानीय पथ पर केवल तब सेट करें जब आपको ओवरराइड चाहिए।
`openclaw doctor` सामान्य क्लाउड-सिंक्ड स्टेट पथों के बारे में चेतावनी देता है और
स्थानीय स्टोरेज पर वापस जाने की अनुशंसा करता है। देखें
[एनवायरनमेंट वैरिएबल्स](/hi/help/environment#path-related-env-vars) और
[Doctor](/hi/gateway/doctor)।

## ऐप कनेक्टिविटी डीबग करें

ऐप द्वारा उपयोग किए जाने वाले उसी Gateway WebSocket हैंडशेक और डिस्कवरी लॉजिक को चलाने के लिए
स्रोत चेकआउट से macOS डीबग CLI का उपयोग करें:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` `--url`, `--token`, `--timeout`, और `--json` स्वीकार करता है। `discover`
`--timeout`, `--json`, और `--include-local` स्वीकार करता है। जब आपको CLI डिस्कवरी
को ऐप-साइड कनेक्शन समस्याओं से अलग करना हो, तो डिस्कवरी आउटपुट की तुलना
`openclaw gateway discover --json` से करें।

## Smoke चेक

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

फिर:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## संबंधित

- [macOS ऐप](/hi/platforms/macos)
- [Gateway रनबुक](/hi/gateway)
