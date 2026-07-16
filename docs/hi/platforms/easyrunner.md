---
read_when:
    - EasyRunner पर OpenClaw को डिप्लॉय करना
    - EasyRunner के Caddy प्रॉक्सी के पीछे Gateway चलाना
    - होस्ट किए गए Gateway के लिए स्थायी वॉल्यूम और प्रमाणीकरण चुनना
summary: Podman और Caddy के साथ EasyRunner पर OpenClaw Gateway चलाएँ
title: ईज़ीरनर
x-i18n:
    generated_at: "2026-07-16T15:48:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner, OpenClaw Gateway को अपने Caddy प्रॉक्सी के पीछे एक छोटे कंटेनरीकृत ऐप के रूप में होस्ट करता है। यह मार्गदर्शिका ऐसे EasyRunner होस्ट को मानकर चलती है जो Podman-संगत Compose ऐप चलाता है और Caddy के माध्यम से HTTPS समाप्त करता है।

## शुरू करने से पहले

- एक EasyRunner सर्वर, जिसकी ओर कोई डोमेन रूट किया गया हो।
- आधिकारिक OpenClaw इमेज (`ghcr.io/openclaw/openclaw`) या आपका स्वयं का बिल्ड।
- `/home/node/.openclaw` के लिए एक स्थायी कॉन्फ़िगरेशन वॉल्यूम।
- `/home/node/.openclaw/workspace` के लिए एक स्थायी कार्यक्षेत्र वॉल्यूम।
- एक मजबूत Gateway टोकन या पासवर्ड।

जहाँ संभव हो, डिवाइस प्रमाणीकरण सक्षम रखें। यदि आपका रिवर्स प्रॉक्सी डिवाइस पहचान को सही ढंग से अग्रेषित नहीं कर सकता, तो पहले विश्वसनीय-प्रॉक्सी सेटिंग ठीक करें ([विश्वसनीय प्रॉक्सी प्रमाणीकरण](/hi/gateway/trusted-proxy-auth) देखें); खतरनाक प्रमाणीकरण बायपास का उपयोग केवल पूरी तरह निजी, ऑपरेटर-नियंत्रित नेटवर्क पर करें।

## Compose ऐप

इस तरह संरचित Compose फ़ाइल के साथ एक EasyRunner ऐप बनाएँ:

```yaml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    restart: unless-stopped
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_HOME: /home/node
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
      OPENCLAW_WORKSPACE_DIR: /home/node/.openclaw/workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/home/node/.openclaw/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

`openclaw.example.com` को अपने Gateway होस्टनाम से बदलें। `OPENCLAW_GATEWAY_TOKEN` को ऐप परिभाषा में कमिट करने के बजाय EasyRunner के सीक्रेट/पर्यावरण प्रबंधक में संग्रहीत करें। इमेज डिफ़ॉल्ट रूप से लूपबैक से बाइंड होती है, इसलिए Caddy द्वारा कंटेनर तक पहुँचने के लिए `command` में स्पष्ट `--bind lan --port 1455` आवश्यक है।

## OpenClaw कॉन्फ़िगर करें

स्थायी कॉन्फ़िगरेशन वॉल्यूम के भीतर, Gateway को केवल प्रॉक्सी के माध्यम से पहुँच योग्य रखें और प्रमाणीकरण अनिवार्य करें:

```json5
{
  gateway: {
    bind: "lan",
    port: 1455,
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

यदि Caddy, Gateway के लिए TLS समाप्त करता है, तो प्रमाणीकरण जाँच को वैश्विक रूप से अक्षम करने के बजाय सटीक प्रॉक्सी पथ के लिए विश्वसनीय-प्रॉक्सी सेटिंग कॉन्फ़िगर करें। [विश्वसनीय प्रॉक्सी प्रमाणीकरण](/hi/gateway/trusted-proxy-auth) देखें।

## सत्यापित करें

अपने वर्कस्टेशन से:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

EasyRunner होस्ट से, `GET /healthz` (सक्रियता) और `GET /readyz` (तत्परता) को प्रमाणीकरण की आवश्यकता नहीं होती और ये इमेज की अंतर्निहित कंटेनर स्वास्थ्य जाँच का आधार हैं। साथ ही, सक्रिय Gateway और स्टार्टअप के दौरान SecretRef, Plugin या चैनल प्रमाणीकरण विफलताओं की अनुपस्थिति के लिए ऐप लॉग जाँचें।

## अपडेट और बैकअप

- नई OpenClaw इमेज पुल या बिल्ड करें, फिर EasyRunner ऐप को पुनः डिप्लॉय करें।
- अपडेट से पहले `openclaw-config` वॉल्यूम का बैकअप लें। इसमें
  `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json`, और इंस्टॉल किए गए
  Plugin पैकेज की स्थिति होती है।
- यदि एजेंट वहाँ स्थायी प्रोजेक्ट डेटा लिखते हैं, तो `openclaw-workspace` का बैकअप लें।
- कॉन्फ़िगरेशन माइग्रेशन और सेवा चेतावनियाँ पकड़ने के लिए बड़े अपडेट के बाद `openclaw doctor` चलाएँ।

## समस्या निवारण

- `gateway probe` कनेक्ट नहीं कर सकता: पुष्टि करें कि Caddy होस्टनाम ऐप की ओर इंगित करता है और कंटेनर `0.0.0.0:1455` पर सुन रहा है।
- प्रमाणीकरण विफल होता है: EasyRunner सीक्रेट और स्थानीय क्लाइंट कमांड, दोनों में टोकन को एक साथ बदलें।
- पुनर्स्थापना के बाद फ़ाइलों का स्वामी रूट है: इमेज `node` (uid 1000) के रूप में चलती है; माउंट किए गए वॉल्यूम ठीक करें, ताकि वह उपयोगकर्ता
  `/home/node/.openclaw` और `/home/node/.openclaw/workspace` में लिख सके।
- ब्राउज़र या चैनल Plugin विफल होते हैं: जाँचें कि आवश्यक बाहरी बाइनरी, नेटवर्क निर्गमन और माउंट किए गए क्रेडेंशियल कंटेनर के भीतर उपलब्ध हैं।
