---
read_when:
    - आप anthropic-vertex Plugin को इंस्टॉल, कॉन्फ़िगर या ऑडिट कर रहे हैं
summary: Google Vertex AI पर Claude मॉडलों के लिए OpenClaw Anthropic Vertex प्रदाता Plugin.
title: Anthropic Vertex Plugin
x-i18n:
    generated_at: "2026-06-28T23:41:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f772c9a5bf1edd6a270b7ba5e6d695290fe96648c9ac38d0bc90bb1504f50cd7
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Anthropic Vertex Plugin

Google Vertex AI पर Claude मॉडल के लिए OpenClaw Anthropic Vertex प्रदाता Plugin।

## वितरण

- पैकेज: `@openclaw/anthropic-vertex-provider`
- इंस्टॉल मार्ग: npm; ClawHub

## सतह

providers: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

जहां मॉडल आपके Google Cloud क्षेत्र में उपलब्ध हो, वहां `anthropic-vertex/claude-fable-5` का उपयोग करें।
Fable 5 हमेशा adaptive thinking का उपयोग करता है और डिफ़ॉल्ट रूप से `high` प्रयास पर रहता है। `/think off` और
`/think minimal` `low` प्रयास का उपयोग करते हैं क्योंकि मॉडल thinking को अक्षम करने का समर्थन नहीं करता।

<!-- openclaw-plugin-reference:manual-end -->
