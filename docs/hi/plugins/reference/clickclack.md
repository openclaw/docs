---
read_when:
    - आप clickclack Plugin को इंस्टॉल, कॉन्फ़िगर या ऑडिट कर रहे हैं
summary: OpenClaw संदेश भेजने और प्राप्त करने के लिए Clickclack चैनल इंटरफ़ेस जोड़ता है।
title: Clickclack Plugin
x-i18n:
    generated_at: "2026-07-20T07:07:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e59a11826dfc14a7c6945930547804b10e9cb5144d9cdb75657be9f8f4e9129f
    source_path: plugins/reference/clickclack.md
    workflow: 16
---

# Clickclack Plugin

OpenClaw संदेश भेजने और प्राप्त करने के लिए Clickclack चैनल सतह जोड़ता है।

## वितरण

- पैकेज: `@openclaw/clickclack`
- इंस्टॉल मार्ग: npm; ClawHub: `clawhub:@openclaw/clickclack`

## सतह

चैनल: `clickclack`

Plugin वैकल्पिक रूप से प्रत्येक OpenClaw सत्र के लिए जीवनचक्र-समन्वित ClickClack चैनल
बना सकता है। प्रबंधित चर्चा चैनल अवलोकन और रिले के लिए उसी एजेंट के सहायक
सत्र का उपयोग करते हैं, जबकि संलग्न मुख्य सत्र को केवल-पुल `discussion` टूल
प्राप्त होता है। कॉन्फ़िगरेशन और सत्र-टूल दृश्यता आवश्यकताओं के लिए
[ClickClack सत्र चर्चाएँ](/hi/channels/clickclack#session-discussions) देखें।

## संबंधित दस्तावेज़

- [clickclack](/hi/channels/clickclack)
