---
read_when:
    - आप शीर्ष ओपन सोर्स LLM के लिए एक ही API कुंजी चाहते हैं
    - आप OpenClaw में DeepInfra के API के ज़रिए मॉडल चलाना चाहते हैं
summary: OpenClaw में सबसे लोकप्रिय ओपन-सोर्स और उन्नत मॉडल तक पहुँचने के लिए DeepInfra की एकीकृत API का उपयोग करें
title: DeepInfra
x-i18n:
    generated_at: "2026-07-16T16:52:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra एकल OpenAI-संगत एंडपॉइंट और API कुंजी के माध्यम से अनुरोधों को लोकप्रिय ओपन सोर्स और अत्याधुनिक मॉडलों तक रूट करता है। अधिकांश OpenAI SDK में केवल बेस URL बदलकर इसका उपयोग किया जा सकता है।

## Plugin इंस्टॉल करें

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## API कुंजी प्राप्त करें

1. [deepinfra.com](https://deepinfra.com/) पर साइन इन करें
2. Dashboard / Keys पर जाएँ और एक कुंजी जनरेट करें, या स्वतः बनाई गई कुंजी का उपयोग करें

## CLI सेटअप

```bash
openclaw onboard --deepinfra-api-key <key>
```

या पर्यावरण चर सेट करें:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## कॉन्फ़िगरेशन स्निपेट

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V4-Flash" },
    },
  },
}
```

## समर्थित सतहें

`DEEPINFRA_API_KEY` कॉन्फ़िगर हो जाने के बाद चैट, छवि जनरेशन और वीडियो जनरेशन अपने मॉडल कैटलॉग को
`https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta` से लाइव रीफ़्रेश करते हैं।
अन्य सतहें उसी लाइव कैटलॉग पर स्थानांतरित होने तक नीचे दिए गए स्थिर
डिफ़ॉल्ट का उपयोग करती हैं।

| सतह                  | डिफ़ॉल्ट मॉडल                                                                                         | OpenClaw कॉन्फ़िगरेशन/टूल                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| चैट / मॉडल प्रदाता    | लाइव कैटलॉग की पहली चैट-टैग वाली प्रविष्टि (स्थिर फ़ॉलबैक `deepseek-ai/DeepSeek-V4-Flash`)           | `agents.defaults.model`                                  |
| छवि जनरेशन/संपादन | लाइव कैटलॉग की पहली `image-gen`-टैग वाली प्रविष्टि (स्थिर फ़ॉलबैक `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| मीडिया की समझ      | छवियों के लिए `moonshotai/Kimi-K2.5`                                                                     | आने वाली छवियों की समझ                              |
| वाक्-से-पाठ           | `openai/whisper-large-v3-turbo`                                                                       | आने वाले ऑडियो का ट्रांसक्रिप्शन                              |
| पाठ-से-वाक्           | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| वीडियो जनरेशन         | स्थिर फ़ॉलबैक `Pixverse/Pixverse-T2V` (DeepInfra से आज कोई लाइव वीडियो-जनरेशन पंक्ति नहीं)                 | `video_generate`, `agents.defaults.videoGenerationModel` |
| मेमोरी एम्बेडिंग        | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra री-रैंकिंग, वर्गीकरण, ऑब्जेक्ट डिटेक्शन और अन्य
नेटिव मॉडल प्रकार भी उपलब्ध कराता है। OpenClaw में अभी उन श्रेणियों के लिए कोई प्रदाता अनुबंध
नहीं है, इसलिए यह Plugin उन्हें पंजीकृत नहीं करता।

## उपलब्ध मॉडल

कुंजी कॉन्फ़िगर हो जाने के बाद OpenClaw, DeepInfra मॉडल को डायनेमिक रूप से खोजता है। वर्तमान
सूची देखने के लिए `/models deepinfra` या `openclaw models list --provider deepinfra` का उपयोग करें।

[deepinfra.com](https://deepinfra.com/) पर उपलब्ध कोई भी मॉडल
`deepinfra/` प्रीफ़िक्स के साथ काम करता है:

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...और भी बहुत से
```

## टिप्पणियाँ

- मॉडल संदर्भ `deepinfra/<provider>/<model>` होते हैं (उदाहरण के लिए `deepinfra/Qwen/Qwen3-Max`)।
- डिफ़ॉल्ट चैट मॉडल: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- बेस URL: `https://api.deepinfra.com/v1/openai`
- नेटिव वीडियो जनरेशन `https://api.deepinfra.com/v1/inference/<model>` का उपयोग करता है।

## संबंधित

- [मॉडल प्रदाता](/hi/concepts/model-providers)
- [सभी प्रदाता](/hi/providers/index)
