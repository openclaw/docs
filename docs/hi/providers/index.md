---
read_when:
    - आप एक मॉडल प्रदाता चुनना चाहते हैं
    - आपको समर्थित LLM बैकएंड का त्वरित अवलोकन चाहिए
summary: OpenClaw द्वारा समर्थित मॉडल प्रदाता (LLMs)
title: प्रदाता डायरेक्टरी
x-i18n:
    generated_at: "2026-07-04T03:48:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3386b41b340048f7ace61077e724a70af36dda83c65d211dde5081b378b1b448
    source_path: providers/index.md
    workflow: 16
---

OpenClaw कई LLM प्रदाताओं का उपयोग कर सकता है। एक प्रदाता चुनें, प्रमाणित करें, फिर
डिफ़ॉल्ट मॉडल को `provider/model` के रूप में सेट करें।

चैट चैनल दस्तावेज़ (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/आदि) खोज रहे हैं? [चैनल](/hi/channels) देखें।

## त्वरित शुरुआत

1. प्रदाता के साथ प्रमाणित करें (आमतौर पर `openclaw onboard` के माध्यम से)।
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
- [BytePlus (अंतरराष्ट्रीय)](/hi/concepts/model-providers#byteplus-international)
- [Cerebras](/hi/providers/cerebras)
- [Chutes](/hi/providers/chutes)
- [ClawRouter (प्रबंधित बहु-प्रदाता रूटिंग)](/providers/clawrouter)
- [Cohere](/hi/providers/cohere)
- [Cloudflare AI Gateway](/hi/providers/cloudflare-ai-gateway)
- [ComfyUI](/hi/providers/comfy)
- [DeepSeek](/hi/providers/deepseek)
- [ds4 (स्थानीय DeepSeek V4)](/hi/providers/ds4)
- [ElevenLabs](/hi/providers/elevenlabs)
- [fal](/hi/providers/fal)
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
- [MiniMax](/hi/providers/minimax)
- [Mistral](/hi/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/hi/providers/moonshot)
- [NVIDIA](/hi/providers/nvidia)
- [NovitaAI](/hi/providers/novita)
- [Ollama (क्लाउड + स्थानीय मॉडल)](/hi/providers/ollama)
- [Ollama Cloud](/hi/providers/ollama-cloud)
- [OpenAI (API + Codex)](/hi/providers/openai)
- [OpenCode](/hi/providers/opencode)
- [OpenCode Go](/hi/providers/opencode-go)
- [OpenRouter](/hi/providers/openrouter)
- [Perplexity (वेब खोज)](/hi/providers/perplexity-provider)
- [Qianfan](/hi/providers/qianfan)
- [Qwen Cloud](/hi/providers/qwen)
- [Qwen OAuth / Portal](/hi/providers/qwen-oauth)
- [Runway](/hi/providers/runway)
- [SenseAudio](/hi/providers/senseaudio)
- [SGLang (स्थानीय मॉडल)](/hi/providers/sglang)
- [StepFun](/hi/providers/stepfun)
- [Synthetic](/hi/providers/synthetic)
- [Tencent Cloud (TokenHub)](/hi/providers/tencent)
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

- [अतिरिक्त बंडल किए गए वेरिएंट](/hi/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy, और Gemini CLI OAuth
- [इमेज जनरेशन](/hi/tools/image-generation) - साझा `image_generate` टूल, प्रदाता चयन, और फ़ेलओवर
- [संगीत जनरेशन](/hi/tools/music-generation) - साझा `music_generate` टूल, प्रदाता चयन, और फ़ेलओवर
- [वीडियो जनरेशन](/hi/tools/video-generation) - साझा `video_generate` टूल, प्रदाता चयन, और फ़ेलओवर

## ट्रांसक्रिप्शन प्रदाता

- [Deepgram (ऑडियो ट्रांसक्रिप्शन)](/hi/providers/deepgram)
- [ElevenLabs](/hi/providers/elevenlabs#speech-to-text)
- [Mistral](/hi/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/hi/providers/openai#speech-to-text)
- [SenseAudio](/hi/providers/senseaudio)
- [xAI](/hi/providers/xai#speech-to-text)

## समुदाय टूल

- [Claude Max API Proxy](/hi/providers/claude-max-api-proxy) - Claude सदस्यता क्रेडेंशियल्स के लिए समुदाय प्रॉक्सी (उपयोग से पहले Anthropic नीति/शर्तें सत्यापित करें)

पूर्ण प्रदाता कैटलॉग (xAI, Groq, Mistral, आदि) और उन्नत कॉन्फ़िगरेशन के लिए,
[मॉडल प्रदाता](/hi/concepts/model-providers) देखें।
