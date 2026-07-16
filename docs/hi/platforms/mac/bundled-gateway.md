---
read_when:
    - OpenClaw.app की पैकेजिंग
    - macOS Gateway launchd सेवा की डीबगिंग
    - macOS के लिए Gateway CLI इंस्टॉल करना
summary: macOS पर Gateway रनटाइम (बाहरी launchd सेवा)
title: macOS पर Gateway
x-i18n:
    generated_at: "2026-07-16T15:45:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 30c1ae14d8f8eaab73d0e2b725292d7411c2c8b5e0e0c32ad13989c01340d054
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app में Node या Gateway रनटाइम बंडल नहीं होता। macOS ऐप
एक **बाहरी** `openclaw` CLI इंस्टॉलेशन की अपेक्षा करता है, Gateway को
चाइल्ड प्रोसेस के रूप में शुरू नहीं करता, और Gateway को चालू रखने के लिए प्रति-उपयोगकर्ता launchd सेवा
प्रबंधित करता है (या पहले से चल रहे स्थानीय Gateway से जुड़ता है)।

## स्वचालित सेटअप

नए Mac पर, ऑनबोर्डिंग के दौरान **This Mac** चुनें। ऐप Gateway विज़ार्ड से पहले अपनी
हस्ताक्षरित, बंडल की गई इंस्टॉलर स्क्रिप्ट चलाता है: यह उपयोगकर्ता-स्पेस Node रनटाइम और
मेल खाने वाला `openclaw` CLI, `~/.openclaw` के अंतर्गत इंस्टॉल करता है,
फिर प्रति-उपयोगकर्ता launchd सेवा इंस्टॉल और शुरू करता है। इस प्रक्रिया के लिए
Terminal, Homebrew या व्यवस्थापक पहुँच की आवश्यकता नहीं होती।

ऐप केवल इंस्टॉलर स्क्रिप्ट बंडल करता है, Node या Gateway पेलोड नहीं;
सेटअप को रनटाइम और मेल खाने वाला OpenClaw पैकेज डाउनलोड करने के लिए इंटरनेट कनेक्शन चाहिए।

## मैन्युअल पुनर्प्राप्ति

मैन्युअल इंस्टॉलेशन के लिए Node 24.15+ अनुशंसित है; Node 22.22.3+ भी काम करता है। 
`openclaw` को वैश्विक रूप से इंस्टॉल करें:

```bash
npm install -g openclaw@<version>
```

स्वचालित सेटअप विफल होने के बाद **Retry setup** का उपयोग करें। यदि वह भी विफल हो,
तो ऊपर दिए गए कमांड से CLI को मैन्युअल रूप से इंस्टॉल करें, फिर ऑनबोर्डिंग में
**Check again** चुनें।

## Launchd (LaunchAgent के रूप में Gateway)

लेबल: `ai.openclaw.gateway` (डिफ़ॉल्ट प्रोफ़ाइल), या नामित प्रोफ़ाइल के लिए
`ai.openclaw.<profile>`।

Plist स्थान (प्रति-उपयोगकर्ता): `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
(या `ai.openclaw.<profile>.plist`)।

Local मोड में डिफ़ॉल्ट प्रोफ़ाइल के लिए LaunchAgent का इंस्टॉलेशन/अपडेट macOS ऐप
प्रबंधित करता है। CLI भी इसे सीधे इंस्टॉल कर सकता है: `openclaw gateway install`
(नामित प्रोफ़ाइल `OPENCLAW_PROFILE` पर्यावरण चर के माध्यम से चुनी जाती हैं)।

व्यवहार:

- "OpenClaw Active" LaunchAgent को सक्षम/अक्षम करता है।
- ऐप बंद करने से Gateway **बंद नहीं** होता (launchd इसे चालू रखता है)।
- यदि कॉन्फ़िगर किए गए पोर्ट पर Gateway पहले से चल रहा है, तो ऐप नया शुरू करने के बजाय
  उससे जुड़ जाता है।

लॉगिंग:

- launchd stdout: `~/Library/Logs/openclaw/gateway.log` (प्रोफ़ाइल
  `gateway-<profile>.log` का उपयोग करती हैं)
- launchd stderr: दबाया गया
- यदि होस्ट बार-बार `EADDRINUSE` या तेज़ पुनरारंभ के साथ लूप करता है, तो
  डुप्लिकेट `ai.openclaw.gateway` / `ai.openclaw.node` LaunchAgents और
  [Gateway समस्या निवारण](/hi/gateway/troubleshooting#macos-launchd-supervisor-loop-with-duplicate-gatewaynode-launchagents)
  में launchd-marker समाधान की जाँच करें।

## संस्करण संगतता

macOS ऐप Gateway के संस्करण की तुलना अपने संस्करण से करता है। यदि कोई मौजूदा CLI
अनुपलब्ध या असंगत है, तो ऑनबोर्डिंग स्वचालित रूप से प्रबंधित सेटअप चलाता है।
इंस्टॉलेशन दोहराने के लिए **Retry setup**, या बाहरी CLI की मरम्मत के बाद
**Check again** का उपयोग करें।

## macOS पर स्थिति निर्देशिका

OpenClaw की स्थिति को स्थानीय, सिंक न होने वाली डिस्क पर रखें। iCloud Drive और अन्य
क्लाउड-सिंक किए गए फ़ोल्डरों से बचें; सिंक विलंबता और फ़ाइल लॉक सत्रों,
क्रेडेंशियल्स और Gateway की स्थिति को प्रभावित कर सकते हैं।

केवल ओवरराइड की आवश्यकता होने पर `OPENCLAW_STATE_DIR` को किसी स्थानीय पथ पर सेट करें।
`openclaw doctor` सामान्य क्लाउड-सिंक किए गए स्थिति पथों के बारे में चेतावनी देता है और
स्थानीय स्टोरेज पर वापस जाने की अनुशंसा करता है। 
[पर्यावरण चर](/hi/help/environment#path-related-env-vars) और
[Doctor](/hi/gateway/doctor) देखें।

## ऐप कनेक्टिविटी डीबग करना

ऐप द्वारा उपयोग किए जाने वाले समान Gateway WebSocket हैंडशेक और डिस्कवरी लॉजिक को
जाँचने के लिए सोर्स चेकआउट से macOS डीबग CLI का उपयोग करें:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect`, `--url`, `--token`, `--timeout`, `--probe`, और `--json`
स्वीकार करता है (साथ ही क्लाइंट-पहचान ओवरराइड; पूरी सूची के लिए `--help` के साथ चलाएँ)।
`discover`, `--timeout`, `--json`, और `--include-local` स्वीकार करता है।
CLI डिस्कवरी को ऐप-पक्ष की कनेक्शन समस्याओं से अलग करने की आवश्यकता होने पर
डिस्कवरी आउटपुट की तुलना `openclaw gateway discover --json` से करें।

## त्वरित जाँच

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
- [Gateway संचालन मार्गदर्शिका](/hi/gateway)
