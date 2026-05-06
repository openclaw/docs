---
read_when:
    - Anda ingin memilih penyedia model
    - Anda memerlukan gambaran singkat tentang backend LLM yang didukung
summary: Penyedia model (model bahasa besar) yang didukung oleh OpenClaw
title: Direktori penyedia
x-i18n:
    generated_at: "2026-05-06T09:25:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfc3a15880a5e1881c1a58c60c9ad7e5624350a8db848d03c7cef6ee18c14b81
    source_path: providers/index.md
    workflow: 16
---

OpenClaw dapat menggunakan banyak penyedia LLM. Pilih penyedia, autentikasikan, lalu tetapkan
model default sebagai `provider/model`.

Mencari dokumentasi kanal chat (WhatsApp/Telegram/Discord/Slack/Mattermost (Plugin)/dll.)? Lihat [Kanal](/id/channels).

## Mulai cepat

1. Autentikasikan dengan penyedia (biasanya melalui `openclaw onboard`).
2. Tetapkan model default:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Dokumentasi penyedia

- [Alibaba Model Studio](/id/providers/alibaba)
- [Amazon Bedrock](/id/providers/bedrock)
- [Amazon Bedrock Mantle](/id/providers/bedrock-mantle)
- [Anthropic (API + Claude CLI)](/id/providers/anthropic)
- [Arcee AI (model Trinity)](/id/providers/arcee)
- [Azure Speech](/id/providers/azure-speech)
- [BytePlus (Internasional)](/id/concepts/model-providers#byteplus-international)
- [Cerebras](/id/providers/cerebras)
- [Chutes](/id/providers/chutes)
- [Cloudflare AI Gateway](/id/providers/cloudflare-ai-gateway)
- [ComfyUI](/id/providers/comfy)
- [DeepSeek](/id/providers/deepseek)
- [ElevenLabs](/id/providers/elevenlabs)
- [fal](/id/providers/fal)
- [Fireworks](/id/providers/fireworks)
- [GitHub Copilot](/id/providers/github-copilot)
- [model GLM](/id/providers/glm)
- [Google (Gemini)](/id/providers/google)
- [Gradium](/id/providers/gradium)
- [Groq (inferensi LPU)](/id/providers/groq)
- [Hugging Face (Inferensi)](/id/providers/huggingface)
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

## Halaman ikhtisar bersama

- [Varian bawaan tambahan](/id/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy, dan Gemini CLI OAuth
- [Pembuatan Gambar](/id/tools/image-generation) - Alat bersama `image_generate`, pemilihan penyedia, dan failover
- [Pembuatan Musik](/id/tools/music-generation) - Alat bersama `music_generate`, pemilihan penyedia, dan failover
- [Pembuatan Video](/id/tools/video-generation) - Alat bersama `video_generate`, pemilihan penyedia, dan failover

## Penyedia transkripsi

- [Deepgram (transkripsi audio)](/id/providers/deepgram)
- [ElevenLabs](/id/providers/elevenlabs#speech-to-text)
- [Mistral](/id/providers/mistral#audio-transcription-voxtral)
- [OpenAI](/id/providers/openai#speech-to-text)
- [SenseAudio](/id/providers/senseaudio)
- [xAI](/id/providers/xai#speech-to-text)

## Alat komunitas

- [Claude Max API Proxy](/id/providers/claude-max-api-proxy) - Proxy komunitas untuk kredensial langganan Claude (verifikasi kebijakan/ketentuan Anthropic sebelum digunakan)

Untuk katalog penyedia lengkap (xAI, Groq, Mistral, dll.) dan konfigurasi lanjutan,
lihat [Penyedia model](/id/concepts/model-providers).
