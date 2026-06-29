---
read_when:
    - आप एक मोबाइल Node ऐप को Gateway के साथ जल्दी पेयर करना चाहते हैं
    - रिमोट/मैनुअल साझा करने के लिए आपको setup-code आउटपुट चाहिए
summary: '`openclaw qr` के लिए CLI संदर्भ (मोबाइल पेयरिंग QR + सेटअप कोड जनरेट करें)'
title: QR
x-i18n:
    generated_at: "2026-06-28T22:52:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d08bbeb69627dafea45c912af4e92c08cd5c79d4ae52bb3f0a6fba5e789acb51
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

- `--remote`: `gateway.remote.url` को प्राथमिकता दें; यदि यह सेट नहीं है, तो `gateway.tailscale.mode=serve|funnel` फिर भी रिमोट सार्वजनिक URL दे सकता है
- `--url <url>`: पेलोड में उपयोग किए गए gateway URL को ओवरराइड करें
- `--public-url <url>`: पेलोड में उपयोग किए गए सार्वजनिक URL को ओवरराइड करें
- `--token <token>`: bootstrap फ़्लो जिस gateway token से प्रमाणित होता है उसे ओवरराइड करें
- `--password <password>`: bootstrap फ़्लो जिस gateway password से प्रमाणित होता है उसे ओवरराइड करें
- `--setup-code-only`: केवल सेटअप कोड प्रिंट करें
- `--no-ascii`: ASCII QR रेंडरिंग छोड़ें
- `--json`: JSON उत्सर्जित करें (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## नोट्स

- `--token` और `--password` परस्पर अनन्य हैं।
- सेटअप कोड में अब shared gateway token/password नहीं, बल्कि एक अपारदर्शी अल्प-आयु `bootstrapToken` होता है।
- Built-in सेटअप-कोड bootstrap `scopes: []` के साथ एक प्राथमिक `node` token और विश्वसनीय मोबाइल onboarding के लिए एक सीमित `operator` handoff token लौटाता है।
- हैंड-ऑफ़ किया गया operator token `operator.approvals`, `operator.read`, `operator.talk.secrets`, और `operator.write` तक सीमित है; `operator.admin` और `operator.pairing` के लिए अलग से स्वीकृत operator pairing या token फ़्लो आवश्यक है।
- मोबाइल pairing Tailscale/सार्वजनिक `ws://` gateway URLs के लिए fail closed होता है। निजी LAN पते और `.local` Bonjour hosts `ws://` पर समर्थित रहते हैं, लेकिन Tailscale/सार्वजनिक मोबाइल routes को Tailscale Serve/Funnel या `wss://` gateway URL का उपयोग करना चाहिए।
- `--remote` के साथ, OpenClaw को या तो `gateway.remote.url` या
  `gateway.tailscale.mode=serve|funnel` की आवश्यकता होती है।
- `--remote` के साथ, यदि प्रभावी रूप से सक्रिय remote credentials SecretRefs के रूप में कॉन्फ़िगर हैं और आप `--token` या `--password` पास नहीं करते हैं, तो command उन्हें सक्रिय gateway snapshot से resolve करता है। यदि gateway उपलब्ध नहीं है, तो command fast fail होता है।
- `--remote` के बिना, local gateway auth SecretRefs तब resolve होते हैं जब कोई CLI auth override पास नहीं किया जाता:
  - `gateway.auth.token` तब resolve होता है जब token auth जीत सकता है (स्पष्ट `gateway.auth.mode="token"` या inferred mode जहां कोई password source नहीं जीतता)।
  - `gateway.auth.password` तब resolve होता है जब password auth जीत सकता है (स्पष्ट `gateway.auth.mode="password"` या inferred mode जिसमें auth/env से कोई winning token नहीं है)।
- यदि `gateway.auth.token` और `gateway.auth.password` दोनों कॉन्फ़िगर हैं (SecretRefs सहित) और `gateway.auth.mode` unset है, तो setup-code resolution तब तक fail होता है जब तक mode स्पष्ट रूप से set न हो।
- Gateway version skew नोट: इस command path को ऐसे gateway की आवश्यकता है जो `secrets.resolve` का समर्थन करता हो; पुराने gateways unknown-method error लौटाते हैं।
- स्कैन करने के बाद, device pairing को इससे approve करें:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [Pairing](/hi/cli/pairing)
