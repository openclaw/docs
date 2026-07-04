---
read_when:
    - आप एक मोबाइल Node ऐप को Gateway के साथ जल्दी पेयर करना चाहते हैं
    - आपको दूरस्थ/मैनुअल साझा करने के लिए setup-code आउटपुट चाहिए
summary: '`openclaw qr` के लिए CLI संदर्भ (मोबाइल पेयरिंग QR + सेटअप कोड जनरेट करें)'
title: QR
x-i18n:
    generated_at: "2026-07-04T17:59:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81d15c9d551960c6f5677649b481e447ecda55a395957746959b4ecf81712bdb
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

अपने मौजूदा Gateway कॉन्फ़िगरेशन से मोबाइल पेयरिंग QR और सेटअप कोड जनरेट करें।

## उपयोग

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## विकल्प

- `--remote`: `gateway.remote.url` को प्राथमिकता दें; अगर यह सेट नहीं है, तो `gateway.tailscale.mode=serve|funnel` फिर भी रिमोट सार्वजनिक URL प्रदान कर सकता है
- `--url <url>`: पेलोड में उपयोग किए गए Gateway URL को ओवरराइड करें
- `--public-url <url>`: पेलोड में उपयोग किए गए सार्वजनिक URL को ओवरराइड करें
- `--token <token>`: बूटस्ट्रैप फ़्लो किस Gateway टोकन के विरुद्ध प्रमाणित होता है, इसे ओवरराइड करें
- `--password <password>`: बूटस्ट्रैप फ़्लो किस Gateway पासवर्ड के विरुद्ध प्रमाणित होता है, इसे ओवरराइड करें
- `--setup-code-only`: केवल सेटअप कोड प्रिंट करें
- `--no-ascii`: ASCII QR रेंडरिंग छोड़ें
- `--json`: JSON उत्सर्जित करें (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## नोट्स

- `--token` और `--password` परस्पर अनन्य हैं।
- सेटअप कोड अब साझा Gateway टोकन/पासवर्ड नहीं, बल्कि एक अपारदर्शी अल्पकालिक `bootstrapToken` रखता है।
- बिल्ट-इन सेटअप-कोड बूटस्ट्रैप `scopes: []` के साथ एक प्राथमिक `node` टोकन और भरोसेमंद मोबाइल ऑनबोर्डिंग के लिए एक सीमित `operator` हैंडऑफ़ टोकन लौटाता है।
- हैंड-ऑफ़ किया गया ऑपरेटर टोकन `operator.approvals`, `operator.read`, `operator.talk.secrets`, और `operator.write` तक सीमित है; पेयरिंग म्यूटेशन स्कोप और `operator.admin` के लिए अब भी अलग स्वीकृत ऑपरेटर पेयरिंग या टोकन फ़्लो चाहिए।
- मोबाइल पेयरिंग Tailscale/सार्वजनिक `ws://` Gateway URL के लिए सुरक्षित रूप से विफल हो जाती है। निजी LAN पते और `.local` Bonjour होस्ट `ws://` पर समर्थित रहते हैं, लेकिन Tailscale/सार्वजनिक मोबाइल रूटों को Tailscale Serve/Funnel या `wss://` Gateway URL का उपयोग करना चाहिए।
- `--remote` के साथ, OpenClaw को या तो `gateway.remote.url` या
  `gateway.tailscale.mode=serve|funnel` चाहिए।
- `--remote` के साथ, अगर प्रभावी रूप से सक्रिय रिमोट क्रेडेंशियल SecretRefs के रूप में कॉन्फ़िगर किए गए हैं और आप `--token` या `--password` पास नहीं करते, तो कमांड उन्हें सक्रिय Gateway स्नैपशॉट से हल करता है। अगर Gateway उपलब्ध नहीं है, तो कमांड तुरंत विफल हो जाता है।
- `--remote` के बिना, जब कोई CLI ऑथ ओवरराइड पास नहीं किया जाता, तो स्थानीय Gateway ऑथ SecretRefs हल किए जाते हैं:
  - `gateway.auth.token` तब हल होता है जब टोकन ऑथ जीत सकता है (स्पष्ट `gateway.auth.mode="token"` या अनुमानित मोड जहां कोई पासवर्ड स्रोत नहीं जीतता)।
  - `gateway.auth.password` तब हल होता है जब पासवर्ड ऑथ जीत सकता है (स्पष्ट `gateway.auth.mode="password"` या अनुमानित मोड जिसमें auth/env से कोई विजयी टोकन नहीं है)।
- अगर `gateway.auth.token` और `gateway.auth.password` दोनों कॉन्फ़िगर किए गए हैं (SecretRefs सहित) और `gateway.auth.mode` सेट नहीं है, तो सेटअप-कोड रिज़ॉल्यूशन तब तक विफल होता है जब तक मोड स्पष्ट रूप से सेट न हो।
- Gateway संस्करण अंतर नोट: इस कमांड पथ के लिए ऐसा Gateway चाहिए जो `secrets.resolve` का समर्थन करता हो; पुराने Gateway अज्ञात-विधि त्रुटि लौटाते हैं।
- आधिकारिक OpenClaw iOS और Android ऐप्स तब अपने-आप कनेक्ट होते हैं जब उनका
  सेटअप-कोड मेटाडेटा मेल खाता है। अगर कोई अनुरोध लंबित रहता है (उदाहरण के लिए,
  किसी गैर-आधिकारिक क्लाइंट या बेमेल मेटाडेटा के लिए), तो इसकी समीक्षा करें और इसे इनके साथ स्वीकृत करें:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [पेयरिंग](/hi/cli/pairing)
