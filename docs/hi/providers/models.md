---
read_when:
    - आप एक मॉडल प्रदाता चुनना चाहते हैं
    - आप LLM प्रमाणीकरण + मॉडल चयन के लिए त्वरित सेटअप उदाहरण चाहते हैं
summary: OpenClaw द्वारा समर्थित मॉडल प्रदाता (LLM)
title: मॉडल प्रदाता त्वरित शुरुआत
x-i18n:
    generated_at: "2026-07-19T09:49:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3988d6985cbe203a6a3357d59160190990b1b53245ea25f1538dbc6f567afec1
    source_path: providers/models.md
    workflow: 16
---

कोई प्रदाता चुनें, प्रमाणीकरण करें, फिर डिफ़ॉल्ट मॉडल को `provider/model` के रूप में सेट करें।

## त्वरित शुरुआत (दो चरण)

1. प्रदाता के साथ प्रमाणीकरण करें (आमतौर पर `openclaw onboard` के माध्यम से)।
2. डिफ़ॉल्ट मॉडल सेट करें:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## समर्थित प्रदाता (प्रारंभिक समूह)

- [Alibaba Model Studio](/hi/providers/alibaba)
- [Amazon Bedrock](/hi/providers/bedrock)
- [Anthropic (API + Claude CLI)](/hi/providers/anthropic)
- [Baseten (Inkling + Model API)](/providers/baseten)
- [BytePlus (अंतरराष्ट्रीय)](/hi/concepts/model-providers#byteplus-international)
- [Chutes](/hi/providers/chutes)
- [Cloudflare AI Gateway](/hi/providers/cloudflare-ai-gateway)
- [Cohere](/hi/providers/cohere)
- [ComfyUI](/hi/providers/comfy)
- [DeepInfra](/hi/providers/deepinfra)
- [fal](/hi/providers/fal)
- [Fireworks](/hi/providers/fireworks)
- [MiniMax](/hi/providers/minimax)
- [Mistral](/hi/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/hi/providers/moonshot)
- [NovitaAI](/hi/providers/novita)
- [OpenAI (API + Codex)](/hi/providers/openai)
- [OpenCode (Zen + Go)](/hi/providers/opencode)
- [OpenRouter](/hi/providers/openrouter)
- [Qianfan](/hi/providers/qianfan)
- [Qwen](/hi/providers/qwen)
- [Runway](/hi/providers/runway)
- [StepFun](/hi/providers/stepfun)
- [Synthetic](/hi/providers/synthetic)
- [Venice (Venice AI)](/hi/providers/venice)
- [Vercel AI Gateway](/hi/providers/vercel-ai-gateway)
- [xAI](/hi/providers/xai)
- [Z.AI (GLM)](/hi/providers/zai)

प्रदाताओं की पूरी सूची और उन्नत कॉन्फ़िगरेशन के लिए,
[प्रदाता निर्देशिका](/hi/providers/index) और [मॉडल प्रदाता](/hi/concepts/model-providers) देखें।

## प्रदाताओं के अतिरिक्त प्रकार

- `anthropic-vertex` - Vertex क्रेडेंशियल उपलब्ध होने पर Google Vertex पर अंतर्निहित Anthropic समर्थन के लिए `@openclaw/anthropic-vertex-provider` इंस्टॉल करें; ऑनबोर्डिंग में प्रमाणीकरण का कोई अलग विकल्प नहीं है
- `copilot-proxy` - स्थानीय VS Code Copilot Proxy ब्रिज; `openclaw onboard --auth-choice copilot-proxy` का उपयोग करें
- `google-gemini-cli` - अनाधिकारिक Gemini CLI OAuth प्रवाह; इसके लिए स्थानीय `gemini` इंस्टॉलेशन आवश्यक है (`brew install gemini-cli` या `npm install -g @google/gemini-cli`); डिफ़ॉल्ट मॉडल `google-gemini-cli/gemini-3-flash-preview`; `openclaw onboard --auth-choice google-gemini-cli` या `openclaw models auth login --provider google-gemini-cli --set-default` का उपयोग करें

## संबंधित

- [प्रदाता निर्देशिका](/hi/providers/index)
- [मॉडल चयन](/hi/concepts/model-providers)
- [मॉडल फ़ेलओवर](/hi/concepts/model-failover)
- [मॉडल CLI](/hi/cli/models)
