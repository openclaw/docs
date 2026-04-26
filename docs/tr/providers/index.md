---
read_when:
    - Bir model sağlayıcısı seçmek istiyorsunuz
    - Desteklenen LLM arka uçlarına hızlı bir genel bakışa ihtiyacınız var
summary: OpenClaw tarafından desteklenen model sağlayıcıları (LLM'ler)
title: Sağlayıcı dizini
x-i18n:
    generated_at: "2026-04-26T11:39:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5d3bf5b30bd7a1dbd8b1348f4f07f178fea9bfea523afa96cad2a30d566a139
    source_path: providers/index.md
    workflow: 15
---

# Model Sağlayıcıları

OpenClaw birçok LLM sağlayıcısını kullanabilir. Bir sağlayıcı seçin, kimlik doğrulaması yapın, ardından
varsayılan modeli `provider/model` olarak ayarlayın.

Sohbet kanalı belgelerini mi arıyorsunuz (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/vb.)? Bkz. [Kanallar](/tr/channels).

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
- [Arcee AI (Trinity modelleri)](/tr/providers/arcee)
- [Azure Speech](/tr/providers/azure-speech)
- [BytePlus (Uluslararası)](/tr/concepts/model-providers#byteplus-international)
- [Chutes](/tr/providers/chutes)
- [Cloudflare AI Gateway](/tr/providers/cloudflare-ai-gateway)
- [ComfyUI](/tr/providers/comfy)
- [DeepSeek](/tr/providers/deepseek)
- [ElevenLabs](/tr/providers/elevenlabs)
- [fal](/tr/providers/fal)
- [Fireworks](/tr/providers/fireworks)
- [GitHub Copilot](/tr/providers/github-copilot)
- [Gradium](/tr/providers/gradium)
- [GLM modelleri](/tr/providers/glm)
- [Google (Gemini)](/tr/providers/google)
- [Groq (LPU çıkarımı)](/tr/providers/groq)
- [Hugging Face (Inference)](/tr/providers/huggingface)
- [inferrs (yerel modeller)](/tr/providers/inferrs)
- [Kilocode](/tr/providers/kilocode)
- [LiteLLM (birleşik Gateway)](/tr/providers/litellm)
- [LM Studio (yerel modeller)](/tr/providers/lmstudio)
- [MiniMax](/tr/providers/minimax)
- [Mistral](/tr/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/tr/providers/moonshot)
- [NVIDIA](/tr/providers/nvidia)
- [Ollama (bulut + yerel modeller)](/tr/providers/ollama)
- [OpenAI (API + Codex)](/tr/providers/openai)
- [OpenCode](/tr/providers/opencode)
- [OpenCode Go](/tr/providers/opencode-go)
- [OpenRouter](/tr/providers/openrouter)
- [Perplexity (web arama)](/tr/providers/perplexity-provider)
- [Qianfan](/tr/providers/qianfan)
- [Qwen Cloud](/tr/providers/qwen)
- [Runway](/tr/providers/runway)
- [SenseAudio](/tr/providers/senseaudio)
- [SGLang (yerel modeller)](/tr/providers/sglang)
- [StepFun](/tr/providers/stepfun)
- [Synthetic](/tr/providers/synthetic)
- [Tencent Cloud (TokenHub)](/tr/providers/tencent)
- [Together AI](/tr/providers/together)
- [Venice (Venice AI, gizlilik odaklı)](/tr/providers/venice)
- [Vercel AI Gateway](/tr/providers/vercel-ai-gateway)
- [vLLM (yerel modeller)](/tr/providers/vllm)
- [Volcengine (Doubao)](/tr/providers/volcengine)
- [Vydra](/tr/providers/vydra)
- [xAI](/tr/providers/xai)
- [Xiaomi](/tr/providers/xiaomi)
- [Z.AI](/tr/providers/zai)

## Paylaşılan genel bakış sayfaları

- [Ek bundled varyantlar](/tr/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy ve Gemini CLI OAuth
- [Görsel Üretimi](/tr/tools/image-generation) - Paylaşılan `image_generate` aracı, sağlayıcı seçimi ve yedekleme
- [Müzik Üretimi](/tr/tools/music-generation) - Paylaşılan `music_generate` aracı, sağlayıcı seçimi ve yedekleme
- [Video Üretimi](/tr/tools/video-generation) - Paylaşılan `video_generate` aracı, sağlayıcı seçimi ve yedekleme

## Transkripsiyon sağlayıcıları

- [Deepgram (ses transkripsiyonu)](/tr/providers/deepgram)
- [ElevenLabs](/tr/providers/elevenlabs#speech-to-text)
- [Mistral](/tr/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/tr/providers/openai#speech-to-text)
- [SenseAudio](/tr/providers/senseaudio)
- [xAI](/tr/providers/xai#speech-to-text)

## Topluluk araçları

- [Claude Max API Proxy](/tr/providers/claude-max-api-proxy) - Claude abonelik kimlik bilgileri için topluluk proxy'si (kullanmadan önce Anthropic politika/şartlarını doğrulayın)

Tam sağlayıcı kataloğu (xAI, Groq, Mistral vb.) ve gelişmiş yapılandırma için
bkz. [Model sağlayıcıları](/tr/concepts/model-providers).
