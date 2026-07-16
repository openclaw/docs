---
read_when:
    - आप opencode Plugin को इंस्टॉल, कॉन्फ़िगर या ऑडिट कर रहे हैं
summary: OpenClaw में OpenCode मॉडल प्रदाता का समर्थन जोड़ता है।
title: OpenCode Plugin
x-i18n:
    generated_at: "2026-07-16T16:17:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aecf396cfc645e4a036b8130ed7f33db9081dffda120c6d06ebe863dd3be3730
    source_path: plugins/reference/opencode.md
    workflow: 16
---

# OpenCode Plugin

OpenClaw में OpenCode मॉडल प्रदाता का समर्थन जोड़ता है।

## वितरण

- पैकेज: `@openclaw/opencode-provider`
- इंस्टॉल मार्ग: OpenClaw में शामिल

## सतह

प्रदाता: `opencode`; अनुबंध: `mediaUnderstandingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## नेटिव सत्र

OpenClaw, Gateway और युग्मित Node पर `opencode` CLI का स्वतः पता लगाता है। इसके बाद संग्रहीत
सत्र **OpenCode** सत्र-साइडबार समूह में दिखाई देते हैं, जहाँ आधिकारिक `opencode --pure db ... --format json`
और `opencode --pure export` कमांड के माध्यम से ट्रांसक्रिप्ट को केवल पढ़ने के लिए
ब्राउज़ किया जा सकता है। प्रतिबंधित परिवेश और `--pure`
मोड, कैटलॉग ब्राउज़िंग को प्रोजेक्ट Plugin लोड करने या असंबंधित
Gateway क्रेडेंशियल इनहेरिट करने से रोकते हैं।

डिस्कवरी अक्षम करने के लिए **Config > Plugins > OpenCode** के अंतर्गत
**OpenCode Session Catalog** बंद करें। यह डिफ़ॉल्ट रूप से सक्षम है।

<!-- openclaw-plugin-reference:manual-end -->

## संबंधित दस्तावेज़

- [opencode](/hi/providers/opencode)
