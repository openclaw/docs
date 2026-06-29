---
read_when:
    - आप फ़ाइल-स्थानांतरण Plugin इंस्टॉल, कॉन्फ़िगर या ऑडिट कर रहे हैं
summary: समर्पित नोड कमांड के माध्यम से युग्मित नोड्स पर फ़ाइलें प्राप्त करें, सूचीबद्ध करें, और लिखें। 16 MB तक की बाइनरी फ़ाइलों के लिए node.invoke पर base64 का उपयोग करके bash stdout truncation को बायपास करता है।
title: फ़ाइल स्थानांतरण Plugin
x-i18n:
    generated_at: "2026-06-28T23:44:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63f931b4bac0d212ae503a3816a527b94b3ca113677a6f52416293a2e381b24b
    source_path: plugins/reference/file-transfer.md
    workflow: 16
---

# फ़ाइल ट्रांसफ़र Plugin

युग्मित नोड्स पर समर्पित नोड कमांड के ज़रिए फ़ाइलें लाएँ, सूचीबद्ध करें, और लिखें। 16 MB तक की बाइनरी फ़ाइलों के लिए node.invoke पर base64 का उपयोग करके bash stdout truncation को बायपास करता है।

## वितरण

- पैकेज: `@openclaw/file-transfer`
- इंस्टॉल रूट: OpenClaw में शामिल

## इंटरफ़ेस

contracts: tools
