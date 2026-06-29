---
read_when:
    - आप एक मॉडल प्रदाता चुनना चाहते हैं
    - आपको LLM प्रमाणीकरण + मॉडल चयन के लिए त्वरित सेटअप उदाहरण चाहिए
summary: OpenClaw द्वारा समर्थित मॉडल प्रदाता (LLMs)
title: मॉडल प्रदाता क्विकस्टार्ट
x-i18n:
    generated_at: "2026-06-29T00:00:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca59b0203b4b5e327b2718a356f6fc1da2f868dac4ca219a2597a96dbf949804
    source_path: providers/models.md
    workflow: 16
---

OpenClaw कई LLM प्रदाताओं का उपयोग कर सकता है। कोई एक चुनें, प्रमाणीकरण करें, फिर डिफ़ॉल्ट
मॉडल को `provider/model` के रूप में सेट करें।

## त्वरित शुरुआत (दो चरण)

1. प्रदाता के साथ प्रमाणीकरण करें (आम तौर पर `openclaw onboard` के ज़रिए)।
2. डिफ़ॉल्ट मॉडल सेट करें:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## समर्थित प्रदाता (प्रारंभिक सेट)

- [Alibaba Model Studio](/hi/providers/alibaba)
- [Amazon Bedrock](/hi/providers/bedrock)
- [Anthropic (API + Claude CLI)](/hi/providers/anthropic)
- [BytePlus (अंतरराष्ट्रीय)](/hi/concepts/model-providers#byteplus-international)
- [Chutes](/hi/providers/chutes)
- [Cohere](/hi/providers/cohere)
- [ComfyUI](/hi/providers/comfy)
- [Cloudflare AI Gateway](/hi/providers/cloudflare-ai-gateway)
- [DeepInfra](/hi/providers/deepinfra)
- [fal](/hi/providers/fal)
- [Fireworks](/hi/providers/fireworks)
- [MiniMax](/hi/providers/minimax)
- [Mistral](/hi/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/hi/providers/moonshot)
- [OpenAI (API + Codex)](/hi/providers/openai)
- [OpenCode (Zen + Go)](/hi/providers/opencode)
- [OpenRouter](/hi/providers/openrouter)
- [Qianfan](/hi/providers/qianfan)
- [Qwen](/hi/providers/qwen)
- [Runway](/hi/providers/runway)
- [StepFun](/hi/providers/stepfun)
- [Synthetic](/hi/providers/synthetic)
- [Vercel AI Gateway](/hi/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/hi/providers/venice)
- [xAI](/hi/providers/xai)
- [Z.AI (GLM)](/hi/providers/zai)

## अतिरिक्त प्रदाता वेरिएंट

- `anthropic-vertex` - Google Vertex समर्थन पर अंतर्निहित Anthropic के लिए `@openclaw/anthropic-vertex-provider` इंस्टॉल करें, जब Vertex क्रेडेंशियल उपलब्ध हों; अलग से ऑनबोर्डिंग प्रमाणीकरण विकल्प नहीं
- `copilot-proxy` - स्थानीय VS Code Copilot Proxy ब्रिज; `openclaw onboard --auth-choice copilot-proxy` का उपयोग करें
- `google-gemini-cli` - अनाधिकारिक Gemini CLI OAuth फ़्लो; स्थानीय `gemini` इंस्टॉल की आवश्यकता है (`brew install gemini-cli` या `npm install -g @google/gemini-cli`); डिफ़ॉल्ट मॉडल `google-gemini-cli/gemini-3-flash-preview`; `openclaw onboard --auth-choice google-gemini-cli` या `openclaw models auth login --provider google-gemini-cli --set-default` का उपयोग करें

पूर्ण प्रदाता कैटलॉग (xAI, Groq, Mistral आदि) और उन्नत कॉन्फ़िगरेशन के लिए,
[मॉडल प्रदाता](/hi/concepts/model-providers) देखें।

## संबंधित

- [मॉडल चयन](/hi/concepts/model-providers)
- [मॉडल फ़ेलओवर](/hi/concepts/model-failover)
- [Models CLI](/hi/cli/models)
