---
read_when:
    - Bir model sağlayıcı seçmek istiyorsunuz
    - Desteklenen LLM backend'lerine dair hızlı bir genel bakışa ihtiyacınız var
summary: OpenClaw tarafından desteklenen model sağlayıcıları (LLM'ler)
title: Sağlayıcı dizini
x-i18n:
    generated_at: "2026-04-24T09:26:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e76c2688398e12a4467327505bf5fe8b40cf66c74a66dd586c0ccadd50e6705
    source_path: providers/index.md
    workflow: 15
---

# Model Sağlayıcıları

OpenClaw birçok LLM sağlayıcısını kullanabilir. Bir sağlayıcı seçin, kimlik doğrulaması yapın, sonra
varsayılan modeli `provider/model` olarak ayarlayın.

Sohbet kanalı belgelerini mi arıyorsunuz (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/vb.)? Bkz. [Channels](/tr/channels).

## Hızlı başlangıç

1. Sağlayıcıyla kimlik doğrulaması yapın (genellikle `openclaw onboard` ile).
2. Varsayılan modeli ayarlayın:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Sağlayıcı belgeleri

- [Alibaba Model Studio](/tr/providers/alibaba)
- [Amazon Bedrock](/tr/providers/bedrock)
- [Amazon Bedrock Mantle](/tr/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/tr/providers/anthropic)
- [Arcee AI (Trinity models)](/tr/providers/arcee)
- [BytePlus (International)](/tr/concepts/model-providers#byteplus-international)
- [Chutes](/tr/providers/chutes)
- [Cloudflare AI Gateway](/tr/providers/cloudflare-ai-gateway)
- [ComfyUI](/tr/providers/comfy)
- [DeepSeek](/tr/providers/deepseek)
- [ElevenLabs](/tr/providers/elevenlabs)
- [fal](/tr/providers/fal)
- [Fireworks](/tr/providers/fireworks)
- [GitHub Copilot](/tr/providers/github-copilot)
- [GLM models](/tr/providers/glm)
- [Google (Gemini)](/tr/providers/google)
- [Groq (LPU inference)](/tr/providers/groq)
- [Hugging Face (Inference)](/tr/providers/huggingface)
- [inferrs (local models)](/tr/providers/inferrs)
- [Kilocode](/tr/providers/kilocode)
- [LiteLLM (unified gateway)](/tr/providers/litellm)
- [LM Studio (local models)](/tr/providers/lmstudio)
- [MiniMax](/tr/providers/minimax)
- [Mistral](/tr/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/tr/providers/moonshot)
- [NVIDIA](/tr/providers/nvidia)
- [Ollama (cloud + local models)](/tr/providers/ollama)
- [OpenAI (API + Codex)](/tr/providers/openai)
- [OpenCode](/tr/providers/opencode)
- [OpenCode Go](/tr/providers/opencode-go)
- [OpenRouter](/tr/providers/openrouter)
- [Perplexity (web search)](/tr/providers/perplexity-provider)
- [Qianfan](/tr/providers/qianfan)
- [Qwen Cloud](/tr/providers/qwen)
- [Runway](/tr/providers/runway)
- [SGLang (local models)](/tr/providers/sglang)
- [StepFun](/tr/providers/stepfun)
- [Synthetic](/tr/providers/synthetic)
- [Tencent Cloud (TokenHub)](/tr/providers/tencent)
- [Together AI](/tr/providers/together)
- [Venice (Venice AI, privacy-focused)](/tr/providers/venice)
- [Vercel AI Gateway](/tr/providers/vercel-ai-gateway)
- [vLLM (local models)](/tr/providers/vllm)
- [Volcengine (Doubao)](/tr/providers/volcengine)
- [Vydra](/tr/providers/vydra)
- [xAI](/tr/providers/xai)
- [Xiaomi](/tr/providers/xiaomi)
- [Z.AI](/tr/providers/zai)

## Paylaşılan genel bakış sayfaları

- [Additional bundled variants](/tr/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy ve Gemini CLI OAuth
- [Image Generation](/tr/tools/image-generation) - Paylaşılan `image_generate` aracı, sağlayıcı seçimi ve failover
- [Music Generation](/tr/tools/music-generation) - Paylaşılan `music_generate` aracı, sağlayıcı seçimi ve failover
- [Video Generation](/tr/tools/video-generation) - Paylaşılan `video_generate` aracı, sağlayıcı seçimi ve failover

## Transkripsiyon sağlayıcıları

- [Deepgram (ses transkripsiyonu)](/tr/providers/deepgram)
- [ElevenLabs](/tr/providers/elevenlabs#speech-to-text)
- [Mistral](/tr/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/tr/providers/openai#speech-to-text)
- [xAI](/tr/providers/xai#speech-to-text)

## Topluluk araçları

- [Claude Max API Proxy](/tr/providers/claude-max-api-proxy) - Claude abonelik kimlik bilgileri için topluluk proxy'si (kullanmadan önce Anthropic ilkesini/şartlarını doğrulayın)

Tam sağlayıcı kataloğu (xAI, Groq, Mistral vb.) ve gelişmiş yapılandırma için
bkz. [Model providers](/tr/concepts/model-providers).
