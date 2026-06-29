---
read_when:
    - OpenClaw को Railway पर तैनात करना
    - आप ब्राउज़र-आधारित नियंत्रण UI के साथ एक-क्लिक क्लाउड परिनियोजन चाहते हैं
summary: एक-क्लिक टेम्पलेट के साथ Railway पर OpenClaw तैनात करें
title: रेलवे
x-i18n:
    generated_at: "2026-06-28T23:23:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 989c8467ead04b8aa7c94101abd99c936ecd3e451fe728afe8c2f2bd5a78df48
    source_path: install/railway.mdx
    workflow: 16
---

# Railway

एक-क्लिक टेम्पलेट के साथ Railway पर OpenClaw डिप्लॉय करें और इसे वेब Control UI के माध्यम से एक्सेस करें।
यह सबसे आसान "सर्वर पर कोई टर्मिनल नहीं" रास्ता है: Railway आपके लिए Gateway चलाता है।

## त्वरित चेकलिस्ट (नए उपयोगकर्ता)

1. **Deploy on Railway** (नीचे) पर क्लिक करें।
2. `/data` पर माउंट किया गया एक **Volume** जोड़ें।
3. आवश्यक **Variables** सेट करें (कम से कम `OPENCLAW_GATEWAY_PORT` और `OPENCLAW_GATEWAY_TOKEN`)।
4. पोर्ट `8080` पर **HTTP Proxy** सक्षम करें।
5. `https://<your-railway-domain>/openclaw` खोलें और कॉन्फ़िगर किए गए साझा सीक्रेट का उपयोग करके कनेक्ट करें। यह टेम्पलेट डिफ़ॉल्ट रूप से `OPENCLAW_GATEWAY_TOKEN` का उपयोग करता है; यदि आप इसे पासवर्ड प्रमाणीकरण से बदलते हैं, तो इसके बजाय उस पासवर्ड का उपयोग करें।

## एक-क्लिक डिप्लॉय

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Railway पर डिप्लॉय करें
</a>

डिप्लॉय के बाद, अपना सार्वजनिक URL **Railway → your service → Settings → Domains** में खोजें।

Railway या तो:

- आपको एक जनरेट किया गया डोमेन देगा (अक्सर `https://<something>.up.railway.app`), या
- यदि आपने कोई कस्टम डोमेन जोड़ा है, तो उसका उपयोग करेगा।

फिर खोलें:

- `https://<your-railway-domain>/openclaw` — Control UI

## आपको क्या मिलता है

- होस्टेड OpenClaw Gateway + Control UI
- Railway Volume (`/data`) के माध्यम से स्थायी स्टोरेज, ताकि `openclaw.json`,
  प्रति-एजेंट `auth-profiles.json`, चैनल/प्रोवाइडर स्थिति, सत्र, और
  वर्कस्पेस पुनः डिप्लॉयमेंट के बाद भी बने रहें

## आवश्यक Railway सेटिंग्स

### सार्वजनिक नेटवर्किंग

सेवा के लिए **HTTP Proxy** सक्षम करें।

- पोर्ट: `8080`

### Volume (आवश्यक)

यहां माउंट किया गया Volume अटैच करें:

- `/data`

### Variables

सेवा पर ये Variables सेट करें:

- `OPENCLAW_GATEWAY_PORT=8080` (आवश्यक — Public Networking में पोर्ट से मेल खाना चाहिए)
- `OPENCLAW_GATEWAY_TOKEN` (आवश्यक; इसे एडमिन सीक्रेट मानें)
- `OPENCLAW_STATE_DIR=/data/.openclaw` (अनुशंसित)
- `OPENCLAW_WORKSPACE_DIR=/data/workspace` (अनुशंसित)

## चैनल कनेक्ट करें

चैनल सेटअप निर्देशों के लिए `/openclaw` पर Control UI का उपयोग करें या Railway के शेल के माध्यम से `openclaw onboard` चलाएं:

- [Telegram](/hi/channels/telegram) (सबसे तेज़ — बस एक बॉट टोकन)
- [Discord](/hi/channels/discord)
- [सभी चैनल](/hi/channels)

## बैकअप और माइग्रेशन

अपनी स्थिति, कॉन्फ़िग, प्रमाणीकरण प्रोफ़ाइल, और वर्कस्पेस निर्यात करें:

```bash
openclaw backup create
```

यह OpenClaw स्थिति और किसी भी कॉन्फ़िगर किए गए
वर्कस्पेस के साथ एक पोर्टेबल बैकअप आर्काइव बनाता है। विवरण के लिए [बैकअप](/hi/cli/backup) देखें।

## अगले चरण

- मैसेजिंग चैनल सेट करें: [चैनल](/hi/channels)
- Gateway कॉन्फ़िगर करें: [Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration)
- OpenClaw को अद्यतित रखें: [अपडेट करना](/hi/install/updating)
