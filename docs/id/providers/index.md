---
read_when:
    - Anda ingin memilih provider model
    - Anda memerlukan ringkasan cepat tentang backend LLM yang didukung
summary: Provider model (LLM) yang didukung oleh OpenClaw
title: Direktori provider
x-i18n:
    generated_at: "2026-04-26T11:37:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5d3bf5b30bd7a1dbd8b1348f4f07f178fea9bfea523afa96cad2a30d566a139
    source_path: providers/index.md
    workflow: 15
---

# Provider Model

OpenClaw dapat menggunakan banyak provider LLM. Pilih provider, lakukan autentikasi, lalu setel
model default sebagai `provider/model`.

Mencari dokumen kanal chat (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/dll.)? Lihat [Channels](/id/channels).

## Mulai cepat

1. Lakukan autentikasi dengan provider (biasanya melalui `openclaw onboard`).
2. Setel model default:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Dokumen provider

- [Alibaba Model Studio](/id/providers/alibaba)
- [Amazon Bedrock](/id/providers/bedrock)
- [Amazon Bedrock Mantle](/id/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/id/providers/anthropic)
- [Arcee AI (model Trinity)](/id/providers/arcee)
- [Azure Speech](/id/providers/azure-speech)
- [BytePlus (International)](/id/concepts/model-providers#byteplus-international)
- [Chutes](/id/providers/chutes)
- [Cloudflare AI Gateway](/id/providers/cloudflare-ai-gateway)
- [ComfyUI](/id/providers/comfy)
- [DeepSeek](/id/providers/deepseek)
- [ElevenLabs](/id/providers/elevenlabs)
- [fal](/id/providers/fal)
- [Fireworks](/id/providers/fireworks)
- [GitHub Copilot](/id/providers/github-copilot)
- [Gradium](/id/providers/gradium)
- [Model GLM](/id/providers/glm)
- [Google (Gemini)](/id/providers/google)
- [Groq (inferensi LPU)](/id/providers/groq)
- [Hugging Face (Inference)](/id/providers/huggingface)
- [inferrs (model lokal)](/id/providers/inferrs)
- [Kilocode](/id/providers/kilocode)
- [LiteLLM (gateway terpadu)](/id/providers/litellm)
- [LM Studio (model lokal)](/id/providers/lmstudio)
- [MiniMax](/id/providers/minimax)
- [Mistral](/id/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/id/providers/moonshot)
- [NVIDIA](/id/providers/nvidia)
- [Ollama (cloud + model lokal)](/id/providers/ollama)
- [OpenAI (API + Codex)](/id/providers/openai)
- [OpenCode](/id/providers/opencode)
- [OpenCode Go](/id/providers/opencode-go)
- [OpenRouter](/id/providers/openrouter)
- [Perplexity (pencarian web)](/id/providers/perplexity-provider)
- [Qianfan](/id/providers/qianfan)
- [Qwen Cloud](/id/providers/qwen)
- [Runway](/id/providers/runway)
- [SenseAudio](/id/providers/senseaudio)
- [SGLang (model lokal)](/id/providers/sglang)
- [StepFun](/id/providers/stepfun)
- [Synthetic](/id/providers/synthetic)
- [Tencent Cloud (TokenHub)](/id/providers/tencent)
- [Together AI](/id/providers/together)
- [Venice (Venice AI, berfokus pada privasi)](/id/providers/venice)
- [Vercel AI Gateway](/id/providers/vercel-ai-gateway)
- [vLLM (model lokal)](/id/providers/vllm)
- [Volcengine (Doubao)](/id/providers/volcengine)
- [Vydra](/id/providers/vydra)
- [xAI](/id/providers/xai)
- [Xiaomi](/id/providers/xiaomi)
- [Z.AI](/id/providers/zai)

## Halaman ringkasan bersama

- [Varian bawaan tambahan](/id/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy, dan Gemini CLI OAuth
- [Image Generation](/id/tools/image-generation) - Tool `image_generate` bersama, pemilihan provider, dan failover
- [Music Generation](/id/tools/music-generation) - Tool `music_generate` bersama, pemilihan provider, dan failover
- [Video Generation](/id/tools/video-generation) - Tool `video_generate` bersama, pemilihan provider, dan failover

## Provider transkripsi

- [Deepgram (transkripsi audio)](/id/providers/deepgram)
- [ElevenLabs](/id/providers/elevenlabs#speech-to-text)
- [Mistral](/id/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/id/providers/openai#speech-to-text)
- [SenseAudio](/id/providers/senseaudio)
- [xAI](/id/providers/xai#speech-to-text)

## Tool komunitas

- [Claude Max API Proxy](/id/providers/claude-max-api-proxy) - Proxy komunitas untuk kredensial langganan Claude (verifikasi kebijakan/persyaratan Anthropic sebelum digunakan)

Untuk katalog provider lengkap (xAI, Groq, Mistral, dll.) dan konfigurasi lanjutan,
lihat [Model providers](/id/concepts/model-providers).
