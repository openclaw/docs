---
read_when:
    - आप Tailscale + CoreDNS के माध्यम से व्यापक-क्षेत्र खोज (DNS-SD) चाहते हैं
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: '`openclaw dns` के लिए CLI संदर्भ (वाइड-एरिया डिस्कवरी हेल्पर)'
title: DNS
x-i18n:
    generated_at: "2026-06-28T22:48:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 460bdcbaa2c0c0fc1a4f5bdd76b904d8ac35195a25324c66421abfdc2044bb07
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

वाइड-एरिया खोज के लिए DNS सहायक (Tailscale + CoreDNS)। वर्तमान में macOS + Homebrew CoreDNS पर केंद्रित।

संबंधित:

- Gateway खोज: [खोज](/hi/gateway/discovery)
- वाइड-एरिया खोज कॉन्फ़िगरेशन: [कॉन्फ़िगरेशन](/hi/gateway/configuration)

## सेटअप

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

यूनिकास्ट DNS-SD खोज के लिए CoreDNS सेटअप की योजना बनाएं या लागू करें।

विकल्प:

- `--domain <domain>`: वाइड-एरिया खोज डोमेन (उदाहरण के लिए `openclaw.internal`)
- `--apply`: CoreDNS कॉन्फ़िगरेशन इंस्टॉल या अपडेट करें और सेवा को रीस्टार्ट करें (sudo आवश्यक; केवल macOS)

यह क्या दिखाता है:

- हल किया गया खोज डोमेन
- ज़ोन फ़ाइल पथ
- वर्तमान tailnet IP
- अनुशंसित `openclaw.json` खोज कॉन्फ़िगरेशन
- सेट करने के लिए Tailscale Split DNS नेमसर्वर/डोमेन मान

नोट्स:

- `--apply` के बिना, कमांड केवल योजना बनाने वाला सहायक है और अनुशंसित सेटअप प्रिंट करता है।
- यदि `--domain` छोड़ा गया है, तो OpenClaw कॉन्फ़िगरेशन से `discovery.wideArea.domain` का उपयोग करता है।
- `--apply` वर्तमान में केवल macOS का समर्थन करता है और Homebrew CoreDNS की अपेक्षा करता है।
- `--apply` आवश्यकता होने पर ज़ोन फ़ाइल को बूटस्ट्रैप करता है, सुनिश्चित करता है कि CoreDNS import stanza मौजूद है, और `coredns` brew सेवा को रीस्टार्ट करता है।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [खोज](/hi/gateway/discovery)
