---
read_when:
    - आप एक मॉडल प्रदाता चुनना चाहते हैं
    - आपको समर्थित LLM बैकएंड का संक्षिप्त अवलोकन चाहिए
summary: OpenClaw द्वारा समर्थित मॉडल प्रदाता (LLM)
title: प्रदाता निर्देशिका
x-i18n:
    generated_at: "2026-07-19T09:32:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e98910f016e461dedcd06e40a2933631bbd6ac09ceebd340bab82f14805e06a6
    source_path: providers/index.md
    workflow: 16
---

OpenClaw कई LLM प्रदाताओं का उपयोग कर सकता है। कोई प्रदाता चुनें, प्रमाणीकरण करें, फिर
डिफ़ॉल्ट मॉडल को `provider/model` के रूप में सेट करें।

चैट चैनल के दस्तावेज़ (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/आदि) खोज रहे हैं? [चैनल](/hi/channels) देखें।

## त्वरित शुरुआत

1. प्रदाता के साथ प्रमाणीकरण करें (आमतौर पर `openclaw onboard` के माध्यम से)।
2. डिफ़ॉल्ट मॉडल सेट करें:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## प्रदाता दस्तावेज़

- [Alibaba Model Studio](/hi/providers/alibaba)
- [Amazon Bedrock](/hi/providers/bedrock)
- [Amazon Bedrock Mantle](/hi/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/hi/providers/anthropic)
- [Arcee AI (Trinity मॉडल)](/hi/providers/arcee)
- [Azure Speech](/hi/providers/azure-speech)
- [Baseten (Inkling + मॉडल API)](/providers/baseten)
- [BytePlus (अंतरराष्ट्रीय)](/hi/concepts/model-providers#byteplus-international)
- [Cerebras](/hi/providers/cerebras)
- [Chutes](/hi/providers/chutes)
- [ClawRouter (प्रबंधित बहु-प्रदाता रूटिंग)](/hi/providers/clawrouter)
- [Cloudflare AI Gateway](/hi/providers/cloudflare-ai-gateway)
- [Cohere](/hi/providers/cohere)
- [ComfyUI](/hi/providers/comfy)
- [DeepSeek](/hi/providers/deepseek)
- [ds4 (स्थानीय DeepSeek V4)](/hi/providers/ds4)
- [ElevenLabs](/hi/providers/elevenlabs)
- [fal](/hi/providers/fal)
- [Featherless AI](/hi/providers/featherless)
- [Fireworks](/hi/providers/fireworks)
- [GitHub Copilot](/hi/providers/github-copilot)
- [GMI Cloud](/hi/providers/gmi)
- [Google (Gemini)](/hi/providers/google)
- [Gradium](/hi/providers/gradium)
- [Groq (LPU अनुमान)](/hi/providers/groq)
- [Hugging Face (अनुमान)](/hi/providers/huggingface)
- [inferrs (स्थानीय मॉडल)](/hi/providers/inferrs)
- [Kilocode](/hi/providers/kilocode)
- [LiteLLM (एकीकृत Gateway)](/hi/providers/litellm)
- [LM Studio (स्थानीय मॉडल)](/hi/providers/lmstudio)
- [LongCat](/providers/longcat)
- [MiniMax](/hi/providers/minimax)
- [Mistral](/hi/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/hi/providers/moonshot)
- [NovitaAI](/hi/providers/novita)
- [NVIDIA](/hi/providers/nvidia)
- [Ollama (क्लाउड + स्थानीय मॉडल)](/hi/providers/ollama)
- [Ollama Cloud](/hi/providers/ollama-cloud)
- [OpenAI (API + Codex)](/hi/providers/openai)
- [OpenCode](/hi/providers/opencode)
- [OpenCode Go](/hi/providers/opencode-go)
- [OpenRouter](/hi/providers/openrouter)
- [Perplexity (वेब खोज)](/hi/providers/perplexity-provider)
- [Qianfan](/hi/providers/qianfan)
- [Qwen Cloud](/hi/providers/qwen)
- [Runway](/hi/providers/runway)
- [SenseAudio](/hi/providers/senseaudio)
- [SGLang (स्थानीय मॉडल)](/hi/providers/sglang)
- [StepFun](/hi/providers/stepfun)
- [Synthetic](/hi/providers/synthetic)
- [Tencent Cloud (TokenHub / TokenPlan)](/hi/providers/tencent)
- [Together AI](/hi/providers/together)
- [Venice (Venice AI, गोपनीयता-केंद्रित)](/hi/providers/venice)
- [Vercel AI Gateway](/hi/providers/vercel-ai-gateway)
- [vLLM (स्थानीय मॉडल)](/hi/providers/vllm)
- [Volcengine (Doubao)](/hi/providers/volcengine)
- [Vydra](/hi/providers/vydra)
- [xAI](/hi/providers/xai)
- [Xiaomi](/hi/providers/xiaomi)
- [Z.AI (GLM)](/hi/providers/zai)

## साझा अवलोकन पृष्ठ

- [अतिरिक्त प्रदाता संस्करण](/hi/providers/models#additional-provider-variants) - Anthropic Vertex, Copilot Proxy और Gemini CLI OAuth
- [छवि निर्माण](/hi/tools/image-generation) - साझा `image_generate` टूल, प्रदाता चयन और फ़ेलओवर
- [संगीत निर्माण](/hi/tools/music-generation) - साझा `music_generate` टूल, प्रदाता चयन और फ़ेलओवर
- [वीडियो निर्माण](/hi/tools/video-generation) - साझा `video_generate` टूल, प्रदाता चयन और फ़ेलओवर

## प्रतिलेखन प्रदाता

- [Deepgram (ऑडियो प्रतिलेखन)](/hi/providers/deepgram)
- [ElevenLabs](/hi/providers/elevenlabs#speech-to-text)
- [Mistral](/hi/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/hi/providers/openai)
- [SenseAudio](/hi/providers/senseaudio)
- [xAI](/hi/providers/xai)

## सामुदायिक टूल

- [Claude Max API Proxy](/hi/providers/claude-max-api-proxy) - Claude सदस्यता क्रेडेंशियल के लिए सामुदायिक प्रॉक्सी (उपयोग से पहले Anthropic की नीति/शर्तें सत्यापित करें)

संपूर्ण प्रदाता कैटलॉग (xAI, Groq, Mistral आदि) और उन्नत कॉन्फ़िगरेशन के लिए,
[मॉडल प्रदाता](/hi/concepts/model-providers) देखें।
