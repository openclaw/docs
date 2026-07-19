---
read_when:
    - आप llama-cpp Plugin को इंस्टॉल, कॉन्फ़िगर या ऑडिट कर रहे हैं
summary: node-llama-cpp के माध्यम से स्थानीय GGUF टेक्स्ट इन्फ़रेंस और एम्बेडिंग्स।
title: Llama Cpp Plugin
x-i18n:
    generated_at: "2026-07-19T09:35:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2756d4b3e00bbe37b4dedec1d54d28bfe6662e8105504317a402293254ce0240
    source_path: plugins/reference/llama-cpp.md
    workflow: 16
---

# Llama Cpp Plugin

node-llama-cpp के माध्यम से स्थानीय GGUF टेक्स्ट इन्फ़रेंस और एम्बेडिंग।

## वितरण

- पैकेज: `@openclaw/llama-cpp-provider`
- इंस्टॉल मार्ग: npm; ClawHub

## सतह

प्रोवाइडर: `llama-cpp`; अनुबंध: `embeddingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## डिफ़ॉल्ट टेक्स्ट मॉडल

इंटरैक्टिव सेटअप के दौरान, OpenClaw लगभग 5.0 GB के बंडल डाउनलोड के रूप में Gemma 4 E4B IT Q4_K_M प्रदान करता है। इस पेशकश के लिए कम से कम 16 GiB कुल RAM आवश्यक है। छोटी मशीनों पर भी मौजूदा कैश किए गए मॉडल का पता लगाया जाता है।

किसी अन्य मॉडल का उपयोग करने के लिए, `params.modelPath` को किसी भी कस्टम GGUF पर सेट करें। कस्टम मॉडल पर बंडल-डाउनलोड की RAM आवश्यकता लागू नहीं होती। आवश्यकता से कम क्षमता वाली मशीनों पर, आप Ollama या LM Studio के माध्यम से कोई छोटा मॉडल भी चला सकते हैं, या किसी क्लाउड प्रोवाइडर को चुन सकते हैं।

<!-- openclaw-plugin-reference:manual-end -->

## संबंधित दस्तावेज़

- [llama-cpp](/hi/plugins/llama-cpp)
