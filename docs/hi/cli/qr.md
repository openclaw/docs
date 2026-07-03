---
read_when:
    - आप एक मोबाइल Node ऐप को Gateway के साथ जल्दी पेयर करना चाहते हैं
    - आपको रिमोट/मैन्युअल साझाकरण के लिए setup-code आउटपुट चाहिए
summary: '`openclaw qr` के लिए CLI संदर्भ (मोबाइल पेयरिंग QR + सेटअप कोड जनरेट करें)'
title: QR
x-i18n:
    generated_at: "2026-07-03T13:28:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2a0d71fb7be0734a015084bfb5edef74953310d384964eab9cccbabf7c497e3
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

- `--remote`: `gateway.remote.url` को प्राथमिकता दें; अगर यह सेट नहीं है, तो `gateway.tailscale.mode=serve|funnel` फिर भी रिमोट सार्वजनिक URL उपलब्ध करा सकता है
- `--url <url>`: पेलोड में उपयोग किए गए gateway URL को ओवरराइड करें
- `--public-url <url>`: पेलोड में उपयोग किए गए सार्वजनिक URL को ओवरराइड करें
- `--token <token>`: bootstrap फ़्लो जिस gateway token के विरुद्ध प्रमाणीकरण करता है, उसे ओवरराइड करें
- `--password <password>`: bootstrap फ़्लो जिस gateway password के विरुद्ध प्रमाणीकरण करता है, उसे ओवरराइड करें
- `--setup-code-only`: केवल सेटअप कोड प्रिंट करें
- `--no-ascii`: ASCII QR रेंडरिंग छोड़ें
- `--json`: JSON उत्सर्जित करें (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## नोट्स

- `--token` और `--password` परस्पर अनन्य हैं।
- सेटअप कोड अब स्वयं साझा gateway token/password नहीं, बल्कि एक opaque अल्पकालिक `bootstrapToken` रखता है।
- बिल्ट-इन सेटअप-कोड bootstrap एक प्राथमिक `node` token लौटाता है जिसमें `scopes: []` होता है, साथ ही भरोसेमंद मोबाइल ऑनबोर्डिंग के लिए एक सीमित `operator` हैंडऑफ़ token भी लौटाता है।
- हैंड-ऑफ़ किया गया operator token `operator.approvals`, `operator.read`, `operator.talk.secrets`, और `operator.write` तक सीमित है; पेयरिंग mutation scopes और `operator.admin` के लिए अब भी अलग से स्वीकृत operator pairing या token फ़्लो आवश्यक है।
- Tailscale/सार्वजनिक `ws://` gateway URL के लिए मोबाइल पेयरिंग fail closed होती है। निजी LAN पते और `.local` Bonjour होस्ट `ws://` पर समर्थित रहते हैं, लेकिन Tailscale/सार्वजनिक मोबाइल routes को Tailscale Serve/Funnel या `wss://` gateway URL का उपयोग करना चाहिए।
- `--remote` के साथ, OpenClaw को या तो `gateway.remote.url` या
  `gateway.tailscale.mode=serve|funnel` चाहिए।
- `--remote` के साथ, अगर प्रभावी रूप से सक्रिय रिमोट credentials SecretRefs के रूप में कॉन्फ़िगर किए गए हैं और आप `--token` या `--password` पास नहीं करते, तो कमांड उन्हें सक्रिय gateway snapshot से resolve करता है। अगर gateway उपलब्ध नहीं है, तो कमांड तुरंत विफल हो जाता है।
- `--remote` के बिना, जब कोई CLI auth override पास नहीं किया जाता, तो स्थानीय gateway auth SecretRefs resolve किए जाते हैं:
  - `gateway.auth.token` तब resolve होता है जब token auth जीत सकता है (स्पष्ट `gateway.auth.mode="token"` या inferred mode जहाँ कोई password source नहीं जीतता)।
  - `gateway.auth.password` तब resolve होता है जब password auth जीत सकता है (स्पष्ट `gateway.auth.mode="password"` या inferred mode जिसमें auth/env से कोई winning token नहीं है)।
- अगर `gateway.auth.token` और `gateway.auth.password` दोनों कॉन्फ़िगर किए गए हैं (SecretRefs सहित) और `gateway.auth.mode` unset है, तो setup-code resolution तब तक विफल रहता है जब तक mode स्पष्ट रूप से set नहीं किया जाता।
- Gateway version skew नोट: इस command path को ऐसे gateway की आवश्यकता होती है जो `secrets.resolve` का समर्थन करता हो; पुराने gateways unknown-method error लौटाते हैं।
- स्कैन करने के बाद, device pairing को इसके साथ approve करें:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## संबंधित

- [CLI reference](/hi/cli)
- [Pairing](/hi/cli/pairing)
