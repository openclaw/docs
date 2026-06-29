---
read_when:
    - आप अपने मौजूदा टोकन के साथ Control UI खोलना चाहते हैं
    - आप ब्राउज़र लॉन्च किए बिना URL प्रिंट करना चाहते हैं
summary: '`openclaw dashboard` के लिए CLI संदर्भ (नियंत्रण UI खोलें)'
title: डैशबोर्ड
x-i18n:
    generated_at: "2026-06-28T22:48:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 51b3326b3884013ebcf570b417e66efe62ea89dcdedb5ab3173f39fb021de89f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

अपने वर्तमान auth का उपयोग करके Control UI खोलें।

```bash
openclaw dashboard
openclaw dashboard --no-open
```

नोट्स:

- `dashboard` संभव होने पर कॉन्फ़िगर किए गए `gateway.auth.token` SecretRefs को resolve करता है।
- `dashboard` `gateway.tls.enabled` का पालन करता है: TLS-सक्षम gateways
  `https://` Control UI URLs को print/open करते हैं और `wss://` पर connect करते हैं।
- यदि token-authenticated dashboard URL के लिए clipboard/browser delivery विफल होती है,
  तो `dashboard` token value print किए बिना `OPENCLAW_GATEWAY_TOKEN`,
  `gateway.auth.token`, और fragment key `token` का नाम देते हुए एक सुरक्षित manual-auth hint log करता है।
- SecretRef-managed tokens (resolved या unresolved) के लिए, `dashboard` terminal output, clipboard history, या browser-launch arguments में external secrets को उजागर करने से बचने के लिए non-tokenized URL print/copy/open करता है।
- यदि `gateway.auth.token` SecretRef-managed है लेकिन इस command path में unresolved है, तो command invalid token placeholder embed करने के बजाय non-tokenized URL और स्पष्ट remediation guidance print करता है।

## संबंधित

- [CLI reference](/hi/cli)
- [Dashboard](/hi/web/dashboard)
