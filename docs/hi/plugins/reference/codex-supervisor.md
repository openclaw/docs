---
read_when:
    - आप codex-supervisor Plugin इंस्टॉल, कॉन्फ़िगर या ऑडिट कर रहे हैं
summary: OpenClaw से Codex app-server सत्रों की निगरानी करें।
title: Codex पर्यवेक्षक Plugin
x-i18n:
    generated_at: "2026-06-28T23:42:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d0791cf6aab23cb3ac14949742735ac45ac9210c608890048e9e3edc4dd9a5
    source_path: plugins/reference/codex-supervisor.md
    workflow: 16
---

# Codex Supervisor Plugin

OpenClaw से Codex app-server सत्रों की निगरानी करें।

## वितरण

- पैकेज: `@openclaw/codex-supervisor`
- इंस्टॉल मार्ग: OpenClaw में शामिल

## सतह

contracts: tools

<!-- openclaw-plugin-reference:manual-start -->

## सत्र सूचीकरण

`codex_sessions_list` डिफ़ॉल्ट रूप से केवल लोड किए गए Codex सत्रों तक सीमित रहता है। संग्रहीत इतिहास शामिल करने के लिए `include_stored` सेट करें; Plugin Codex app-server के state-DB-only सूचीकरण पथ का उपयोग करता है और संग्रहीत परिणामों को डिफ़ॉल्ट रूप से 200 तक सीमित करता है। इस सीमा को घटाने या बढ़ाने के लिए, अधिकतम 1000 तक, `max_stored_sessions` पास करें।

<!-- openclaw-plugin-reference:manual-end -->
