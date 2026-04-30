---
read_when:
    - Bir model sağlayıcısı seçmek istiyorsunuz
    - Desteklenen LLM arka uçları hakkında hızlı bir genel bakışa ihtiyacınız var
summary: OpenClaw tarafından desteklenen model sağlayıcıları (LLM'ler)
title: Sağlayıcı dizini
x-i18n:
    generated_at: "2026-04-30T09:40:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 61143200b2e7a74392cf8871bfcd210fe35dbd5118e2e8bc7b15265192fd2bde
    source_path: providers/index.md
    workflow: 16
---

# Model Sağlayıcıları

OpenClaw birçok LLM sağlayıcısını kullanabilir. Bir sağlayıcı seçin, kimlik doğrulaması yapın, ardından
varsayılan modeli `provider/model` olarak ayarlayın.

Sohbet kanalı belgelerini mi arıyorsunuz (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/vb.)? Bkz. [Kanallar](/tr/channels).

## Hızlı başlangıç

1. Sağlayıcıyla kimlik doğrulaması yapın (genellikle `openclaw onboard` aracılığıyla).
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
- [Cerebras](/tr/providers/cerebras)
- [Chutes](/tr/providers/chutes)
- [Cloudflare AI Gateway](/tr/providers/cloudflare-ai-gateway)
- [ComfyUI](/tr/providers/comfy)
- [DeepSeek](/tr/providers/deepseek)
- [ElevenLabs](/tr/providers/elevenlabs)
- [fal](/tr/providers/fal)
- [Fireworks](/tr/providers/fireworks)
- [GitHub Copilot](/tr/providers/github-copilot)
- [GLM modelleri](/tr/providers/glm)
- [Google (Gemini)](/tr/providers/google)
- [Gradium](/tr/providers/gradium)
- [Groq (LPU çıkarımı)](/tr/providers/groq)
- [Hugging Face (Inference)](/tr/providers/huggingface)
- [inferrs (yerel modeller)](/tr/providers/inferrs)
- [Kilocode](/tr/providers/kilocode)
- [LiteLLM (birleşik gateway)](/tr/providers/litellm)
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
- [Perplexity (web araması)](/tr/providers/perplexity-provider)
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

- [Ek paketlenmiş varyantlar](/tr/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy ve Gemini CLI OAuth
- [Görüntü Üretimi](/tr/tools/image-generation) - Paylaşılan `image_generate` aracı, sağlayıcı seçimi ve yük devretme
- [Müzik Üretimi](/tr/tools/music-generation) - Paylaşılan `music_generate` aracı, sağlayıcı seçimi ve yük devretme
- [Video Üretimi](/tr/tools/video-generation) - Paylaşılan `video_generate` aracı, sağlayıcı seçimi ve yük devretme

## Transkripsiyon sağlayıcıları

- [Deepgram (ses transkripsiyonu)](/tr/providers/deepgram)
- [ElevenLabs](/tr/providers/elevenlabs#speech-to-text)
- [Mistral](/tr/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/tr/providers/openai#speech-to-text)
- [SenseAudio](/tr/providers/senseaudio)
- [xAI](/tr/providers/xai#speech-to-text)

## Topluluk araçları

- [Claude Max API Proxy](/tr/providers/claude-max-api-proxy) - Claude abonelik kimlik bilgileri için topluluk proxy'si (kullanmadan önce Anthropic politikasını/şartlarını doğrulayın)

Tam sağlayıcı kataloğu (xAI, Groq, Mistral vb.) ve gelişmiş yapılandırma için
bkz. [Model sağlayıcıları](/tr/concepts/model-providers).
