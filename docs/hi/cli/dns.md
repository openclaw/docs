---
read_when:
    - आप Tailscale + CoreDNS के माध्यम से वाइड-एरिया खोज (DNS-SD) चाहते हैं
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: '`openclaw dns` (विस्तृत-क्षेत्र खोज सहायक) के लिए CLI संदर्भ'
title: DNS
x-i18n:
    generated_at: "2026-07-16T13:53:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bb07353df03f9d169e1aede2da0b711ffb68e8c9d21d51359e93e92cc0818ca2
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

व्यापक-क्षेत्र खोज (Tailscale + CoreDNS) के लिए DNS सहायक। वर्तमान में केवल macOS + Homebrew CoreDNS।

संबंधित:

- Gateway खोज: [खोज](/hi/gateway/discovery)
- व्यापक-क्षेत्र खोज कॉन्फ़िगरेशन: [कॉन्फ़िगरेशन](/hi/gateway/configuration)

## `dns setup`

यूनिकास्ट DNS-SD खोज के लिए CoreDNS सेटअप की योजना बनाएँ या उसे लागू करें।

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

| विकल्प              | प्रभाव                                                                              |
| ------------------- | ----------------------------------------------------------------------------------- |
| `--domain <domain>` | व्यापक-क्षेत्र खोज डोमेन (उदाहरण के लिए `openclaw.internal`)।                       |
| `--apply`           | CoreDNS कॉन्फ़िगरेशन इंस्टॉल/अपडेट करता है और सेवा को (पुनः) शुरू करता है। sudo आवश्यक है, केवल macOS। |

`--domain` के बिना, OpenClaw कॉन्फ़िगरेशन से `discovery.wideArea.domain` का उपयोग करता है।

`--apply` के बिना, कमांड केवल निम्न जानकारी प्रिंट करता है:

- समाधान किया गया खोज डोमेन और ज़ोन फ़ाइल पथ
- वर्तमान tailnet IP
- अनुशंसित `openclaw.json` खोज कॉन्फ़िगरेशन
- Tailscale व्यवस्थापक कंसोल में सेट किए जाने वाले Tailscale Split DNS नेमसर्वर/डोमेन मान

`--apply` के साथ (केवल macOS, Homebrew CoreDNS आवश्यक):

- ज़ोन फ़ाइल मौजूद न होने पर उसे बूटस्ट्रैप करता है
- CoreDNS इंपोर्ट स्टैंज़ा मौजूद न होने पर उसे जोड़ता है
- `coredns` brew सेवा को पुनः शुरू करता है

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [खोज](/hi/gateway/discovery)
