---
read_when:
    - आप clickclack Plugin को इंस्टॉल, कॉन्फ़िगर या ऑडिट कर रहे हैं
summary: OpenClaw संदेश भेजने और प्राप्त करने के लिए Clickclack चैनल सतह जोड़ता है।
title: Clickclack Plugin
x-i18n:
    generated_at: "2026-07-21T16:53:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fcb39341009946dc38a12cc24496e65fd704ed3f2f9aff44bb2dd29fdedaef26
    source_path: plugins/reference/clickclack.md
    workflow: 16
---

# Clickclack Plugin

OpenClaw संदेश भेजने और प्राप्त करने के लिए Clickclack चैनल सतह जोड़ता है।

## वितरण

- पैकेज: `@openclaw/clickclack`
- इंस्टॉल मार्ग: npm; ClawHub: `clawhub:@openclaw/clickclack`

## सतह

चैनल: `clickclack`; अनुबंध: `tools`

<!-- openclaw-plugin-reference:manual-start -->

Plugin वैकल्पिक रूप से प्रत्येक OpenClaw सत्र के लिए जीवनचक्र-समन्वयित ClickClack चैनल
बना सकता है। प्रबंधित चर्चा चैनल अवलोकन और रिले के लिए उसी एजेंट के सहायक
सत्र का उपयोग करते हैं, जबकि संलग्न मुख्य सत्र को केवल-पुल `discussion` टूल
मिलता है। कॉन्फ़िगरेशन और सत्र-टूल दृश्यता आवश्यकताओं के लिए
[ClickClack सत्र चर्चाएँ](/hi/channels/clickclack#session-discussions) देखें।

<!-- openclaw-plugin-reference:manual-end -->

## संबंधित दस्तावेज़

- [clickclack](/hi/channels/clickclack)
