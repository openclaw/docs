---
read_when:
    - आप API कुंजी या मॉडल सर्वर के बिना स्थानीय टेक्स्ट इन्फ़रेंस चाहते हैं
    - आप स्थानीय GGUF मॉडल से मेमोरी खोज एम्बेडिंग चाहते हैं
    - आप `memorySearch.provider = "local"` कॉन्फ़िगर कर रहे हैं
    - आपको उस OpenClaw Plugin की आवश्यकता है जो `node-llama-cpp` रनटाइम का स्वामी है
sidebarTitle: llama.cpp Provider
summary: llama.cpp के साथ OpenClaw में स्थानीय GGUF टेक्स्ट इन्फ़रेंस और मेमोरी एम्बेडिंग चलाएँ
title: llama.cpp प्रदाता
x-i18n:
    generated_at: "2026-07-19T09:37:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8af1118ae65741519f81520e6c1c961e208e8dc2c9e1b250979c3758b8fe7c83
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` इन-प्रोसेस स्थानीय GGUF टेक्स्ट अनुमान और एम्बेडिंग के लिए आधिकारिक बाहरी प्रदाता Plugin है। यह टेक्स्ट प्रदाता `llama-cpp`, एम्बेडिंग प्रदाता `local` को पंजीकृत करता है और `node-llama-cpp` नेटिव रनटाइम का स्वामी है।

स्थानीय अनुमान या स्थानीय मेमोरी एम्बेडिंग में से किसी का भी उपयोग करने से पहले इसे इंस्टॉल करें:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

मुख्य `openclaw` npm पैकेज में `node-llama-cpp` शामिल नहीं है। नेटिव निर्भरता को इस Plugin में रखने से OpenClaw के सामान्य npm अपडेट, OpenClaw पैकेज डायरेक्टरी के भीतर मैन्युअल रूप से इंस्टॉल किए गए रनटाइम को नहीं हटाते।

## स्थानीय टेक्स्ट अनुमान

इंटरैक्टिव ऑनबोर्डिंग के दौरान **स्थानीय मॉडल (llama.cpp)** चुनें। डिफ़ॉल्ट मॉडल डाउनलोड करने से पहले OpenClaw पूछता है:

`hf:bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF/Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf`

Qwen3 4B Instruct 2507 Q4_K_M फ़ाइल लगभग 2.5 GB की है। मॉडल वेट्स के लिए लगभग 3 GB RAM के साथ-साथ कॉन्टेक्स्ट और OpenClaw रनटाइम ओवरहेड का प्रावधान रखें। डिफ़ॉल्ट कॉन्टेक्स्ट का आकार 8,192-टोकन सीमा के साथ अपने-आप निर्धारित होता है, ताकि यह 8 GB मशीनों पर व्यावहारिक बना रहे। बड़ा कॉन्टेक्स्ट केवल तभी कॉन्फ़िगर करें, जब मशीन में पर्याप्त मेमोरी हो।

ऑनबोर्डिंग डिस्कवरी जाँच केवल-पढ़ने योग्य है। यह llama.cpp को अपने-आप केवल तभी प्रस्तुत करती है, जब डिफ़ॉल्ट या कॉन्फ़िगर की गई GGUF फ़ाइल मॉडल कैश में पहले से मौजूद हो; यह डिस्कवरी के दौरान कभी डाउनलोड नहीं करती। Ollama और LM Studio अलग स्थानीय सेवा विकल्प बने रहते हैं और अपने स्वयं के डिस्कवरी प्रवाह बनाए रखते हैं। llama.cpp को मैन्युअल रूप से चुनने पर डिफ़ॉल्ट मॉडल डाउनलोड करने का संकेत मिलता है।

प्रदाता GGUF मॉडल के अंतर्निहित चैट टेम्पलेट और नेटिव node-llama-cpp फ़ंक्शन कॉलिंग का उपयोग करता है। टेक्स्ट टोकन-दर-टोकन स्ट्रीम होता है। टूल कॉल node-llama-cpp के भीतर चलने के बजाय निष्पादन के लिए OpenClaw को लौटते हैं।

### किसी अन्य GGUF मॉडल का उपयोग करें

`models.providers.llama-cpp` में एक मॉडल जोड़ें। `params.modelPath` में स्थानीय पथ या पूर्ण `hf:` फ़ाइल URI रखें:

```json5
{
  models: {
    mode: "merge",
    providers: {
      "llama-cpp": {
        baseUrl: "local://llama-cpp",
        api: "openai-completions",
        params: {
          modelCacheDir: "~/.node-llama-cpp/models",
        },
        models: [
          {
            id: "my-local-model",
            name: "My local GGUF",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 2048,
            params: {
              modelPath: "~/Models/my-model.Q4_K_M.gguf",
              contextSize: 8192,
            },
            compat: { supportsTools: true },
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "llama-cpp/my-local-model" },
    },
  },
}
```

अनुमान कभी भी अनुपलब्ध मॉडल को अंतर्निहित रूप से डाउनलोड नहीं करता। कस्टम `hf:` URI के लिए, पहले GGUF को `modelCacheDir` में डाउनलोड करें। डिस्कवरी node-llama-cpp के स्वयं के केवल-पढ़ने योग्य कैश रिज़ॉल्वर का उपयोग करती है, जिसमें रिपॉज़िटरी, ब्रांच और स्प्लिट-फ़ाइल नामकरण शामिल हैं।

## मेमोरी एम्बेडिंग कॉन्फ़िगरेशन

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

`local.modelPath` का डिफ़ॉल्ट ऊपर दिखाया गया `hf:` URI (`embeddinggemma-300m-qat-Q8_0.gguf`) है। किसी अन्य मॉडल का उपयोग करने के लिए इसे किसी भिन्न `hf:` URI या स्थानीय `.gguf` फ़ाइल पर इंगित करें। `local.modelCacheDir` डाउनलोड किए गए मॉडलों के कैश स्थान को ओवरराइड करता है (डिफ़ॉल्ट: `~/.node-llama-cpp/models`), और `local.contextSize` एक पूर्णांक या `"auto"` स्वीकार करता है।

जब `local.contextSize` संख्यात्मक होता है, तो प्रदाता उस आवश्यकता को node-llama-cpp के स्वचालित GPU-लेयर प्लेसमेंट को भी देता है। इससे node-llama-cpp अपनी मेमोरी-सुरक्षा जाँच बनाए रखते हुए मॉडल और एम्बेडिंग कॉन्टेक्स्ट को एक साथ समायोजित कर सकता है। `"auto"` के साथ, node-llama-cpp अपना सामान्य स्वचालित प्लेसमेंट बनाए रखता है।

## नेटिव रनटाइम

सबसे सुगम नेटिव इंस्टॉलेशन प्रक्रिया के लिए Node 24 का उपयोग करें। pnpm का उपयोग करने वाले सोर्स चेकआउट को नेटिव निर्भरता स्वीकृत करके फिर से बिल्ड करनी पड़ सकती है:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## मेमोरी रनटाइम निदान

प्रदाता लोड होने के बाद चयनित बैकएंड और बिल्ड, डिवाइस के नाम, GPU पर ऑफ़लोड की गई लेयर, अनुरोधित कॉन्टेक्स्ट आकार और अंतिम देखे गए VRAM या यूनिफ़ाइड-मेमोरी स्नैपशॉट का निरीक्षण करने के लिए `openclaw memory status --deep` चलाएँ। VRAM मानों में अवलोकन टाइमस्टैम्प शामिल होता है, क्योंकि निष्क्रिय स्थिति रीड मॉडल को फिर से लोड नहीं करतीं या डिवाइस को पोल नहीं करतीं।

जब चल रहे Gateway ने स्थानीय प्रदाता का पहले ही उपयोग किया हो, तो अंतिम ज्ञात यही तथ्य `openclaw doctor` में दिखाई दे सकते हैं। कोई सामान्य स्टेटस या डॉक्टर कमांड केवल निदान एकत्र करने के लिए मॉडल लोड नहीं करता।

## समस्या निवारण

यदि `node-llama-cpp` अनुपलब्ध है या लोड होने में विफल रहता है, तो OpenClaw विफलता के साथ यह रिपोर्ट करता है:

1. Plugin इंस्टॉल करें: `openclaw plugins install @openclaw/llama-cpp-provider`।
2. नेटिव इंस्टॉलेशन/अपडेट के लिए Node 24 का उपयोग करें।
3. pnpm सोर्स चेकआउट से: `pnpm approve-builds`, फिर `pnpm rebuild node-llama-cpp`।

इन-प्रोसेस नेटिव निर्भरता के बिना स्थानीय अनुमान के लिए, इसके बजाय Ollama या LM Studio प्रदाता का उपयोग करें। अधिक सरल स्थानीय एम्बेडिंग के लिए, इसके बजाय `memorySearch.provider` को किसी दूरस्थ एम्बेडिंग प्रदाता, जैसे `lmstudio`, `ollama`, `openai`, या `voyage` पर सेट करें।
