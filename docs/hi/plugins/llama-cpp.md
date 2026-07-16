---
read_when:
    - आप स्थानीय GGUF मॉडल से मेमोरी खोज एम्बेडिंग चाहते हैं
    - आप `memorySearch.provider = "local"` कॉन्फ़िगर कर रहे हैं
    - आपको उस OpenClaw Plugin की आवश्यकता है जो `node-llama-cpp` रनटाइम का स्वामी है
sidebarTitle: llama.cpp Provider
summary: स्थानीय GGUF मेमोरी एम्बेडिंग के लिए आधिकारिक llama.cpp प्रदाता इंस्टॉल करें
title: llama.cpp प्रदाता
x-i18n:
    generated_at: "2026-07-16T16:12:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 369ec199e8493356912337b849a84f829672e8872d17083c9a597f4e5294ebd5
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` स्थानीय GGUF एम्बेडिंग के लिए आधिकारिक बाहरी प्रदाता Plugin है।
यह एम्बेडिंग प्रदाता आईडी `local` पंजीकृत करता है और
`memorySearch.provider: "local"` द्वारा उपयोग की जाने वाली `node-llama-cpp` रनटाइम निर्भरता का स्वामी है।

स्थानीय मेमोरी एम्बेडिंग का उपयोग करने से पहले इसे इंस्टॉल करें:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

मुख्य `openclaw` npm पैकेज में `node-llama-cpp` शामिल नहीं है। मूल
निर्भरता को इस Plugin में रखने से सामान्य OpenClaw npm अपडेट, OpenClaw पैकेज
डायरेक्टरी के भीतर मैन्युअल रूप से इंस्टॉल किए गए रनटाइम को नहीं हटाते।

## कॉन्फ़िगरेशन

`memorySearch.provider` को `local` पर सेट करें:

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

`local.modelPath` का डिफ़ॉल्ट मान ऊपर दिखाया गया `hf:` URI है (`embeddinggemma-300m-qat-Q8_0.gguf`)।
किसी अन्य मॉडल का उपयोग करने के लिए इसे किसी अलग `hf:` URI या स्थानीय
`.gguf` फ़ाइल पर इंगित करें। `local.modelCacheDir` डाउनलोड किए गए मॉडल की कैश
जगह को ओवरराइड करता है (डिफ़ॉल्ट: `~/.node-llama-cpp/models`), और `local.contextSize` एक
पूर्णांक या `"auto"` स्वीकार करता है।

जब `local.contextSize` संख्यात्मक होता है, तो प्रदाता यह आवश्यकता
node-llama-cpp के स्वचालित GPU-लेयर प्लेसमेंट को भी देता है। इससे node-llama-cpp
अपनी मेमोरी-सुरक्षा जाँच बनाए रखते हुए मॉडल और एम्बेडिंग कॉन्टेक्स्ट को एक साथ
समायोजित कर सकता है। `"auto"` के साथ, node-llama-cpp अपना सामान्य
स्वचालित प्लेसमेंट बनाए रखता है।

## मूल रनटाइम

सबसे सुगम मूल इंस्टॉलेशन प्रक्रिया के लिए Node 24 का उपयोग करें। pnpm का उपयोग
करने वाले सोर्स चेकआउट में मूल निर्भरता को स्वीकृत करके फिर से बिल्ड करना पड़ सकता है:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## रनटाइम निदान

प्रदाता लोड होने के बाद चयनित बैकएंड और बिल्ड, डिवाइस के नाम, GPU पर ऑफ़लोड की गई
लेयर, अनुरोधित कॉन्टेक्स्ट आकार और अंतिम बार देखे गए VRAM या यूनिफ़ाइड-मेमोरी
स्नैपशॉट की जाँच करने के लिए `openclaw memory status --deep` चलाएँ। VRAM मानों में अवलोकन का
टाइमस्टैम्प शामिल होता है, क्योंकि निष्क्रिय स्थिति पठन मॉडल को दोबारा लोड नहीं
करते या डिवाइस को पोल नहीं करते।

यदि चल रहे Gateway ने पहले ही स्थानीय प्रदाता का उपयोग किया है, तो यही अंतिम-ज्ञात
तथ्य `openclaw doctor` में दिखाई दे सकते हैं। सामान्य स्थिति या डॉक्टर कमांड केवल
निदान एकत्र करने के लिए मॉडल लोड नहीं करता।

## समस्या निवारण

यदि `node-llama-cpp` अनुपस्थित है या लोड होने में विफल रहता है, तो OpenClaw
इस विफलता के साथ यह रिपोर्ट करता है:

1. Plugin इंस्टॉल करें: `openclaw plugins install @openclaw/llama-cpp-provider`।
2. मूल इंस्टॉलेशन/अपडेट के लिए Node 24 का उपयोग करें।
3. pnpm सोर्स चेकआउट से: `pnpm approve-builds`, फिर `pnpm rebuild node-llama-cpp`।

मूल बिल्ड चरण के बिना अधिक सरल स्थानीय एम्बेडिंग के लिए, इसके बजाय
`memorySearch.provider` को `lmstudio`, `ollama`,
`openai`, या `voyage` जैसे किसी रिमोट एम्बेडिंग प्रदाता पर सेट करें।
