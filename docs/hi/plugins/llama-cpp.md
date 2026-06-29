---
read_when:
    - आप स्थानीय GGUF मॉडल से मेमोरी खोज एम्बेडिंग चाहते हैं
    - आप memorySearch.provider = "local" कॉन्फ़िगर कर रहे हैं
    - आपको उस OpenClaw Plugin की आवश्यकता है जो `node-llama-cpp` रनटाइम का स्वामी है।
sidebarTitle: llama.cpp Provider
summary: स्थानीय GGUF मेमोरी एम्बेडिंग्स के लिए आधिकारिक llama.cpp प्रदाता इंस्टॉल करें
title: llama.cpp प्रदाता
x-i18n:
    generated_at: "2026-06-28T23:36:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b0988c36c5ed5c61a7e97980df291fb43a0071e57c7460bf5a653f516114963
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` स्थानीय GGUF एम्बेडिंग्स के लिए आधिकारिक बाहरी प्रदाता Plugin है।
यह `memorySearch.provider: "local"` द्वारा उपयोग की जाने वाली `node-llama-cpp`
रनटाइम निर्भरता का स्वामी है।

स्थानीय मेमोरी एम्बेडिंग्स का उपयोग करने से पहले इसे इंस्टॉल करें:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

मुख्य `openclaw` npm पैकेज में `node-llama-cpp` शामिल नहीं है। नेटिव निर्भरता
को इस Plugin में रखने से सामान्य OpenClaw npm अपडेट OpenClaw पैकेज डायरेक्टरी
के भीतर मैन्युअल रूप से इंस्टॉल किए गए रनटाइम को हटाने से बचते हैं।

## कॉन्फ़िगरेशन

मेमोरी खोज प्रदाता को `local` पर सेट करें:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        local: {
          modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

डिफ़ॉल्ट मॉडल `embeddinggemma-300m-qat-Q8_0.gguf` है। आप `local.modelPath`
को किसी स्थानीय `.gguf` फ़ाइल की ओर भी इंगित कर सकते हैं।

## नेटिव रनटाइम

सबसे सहज नेटिव इंस्टॉल पथ के लिए Node 24 का उपयोग करें। pnpm का उपयोग करने वाले
सोर्स चेकआउट को नेटिव निर्भरता को स्वीकृत और फिर से बिल्ड करने की आवश्यकता हो
सकती है:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

कम झंझट वाली स्थानीय एम्बेडिंग्स के लिए, इसके बजाय Ollama या LM Studio जैसे
स्थानीय सेवा प्रदाता का उपयोग करें।
