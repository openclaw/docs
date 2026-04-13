---
read_when:
    - Anda ingin memilih penyedia model
    - Anda memerlukan ringkasan cepat tentang backend LLM yang didukung
summary: Penyedia model (LLM) yang didukung oleh OpenClaw
title: Direktori Provider
x-i18n:
    generated_at: "2026-04-13T08:50:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3bc682d008119719826f71f74959ab32bedf14214459f5e6ac9cb70371d3c540
    source_path: providers/index.md
    workflow: 15
---

# Penyedia Model

OpenClaw dapat menggunakan banyak penyedia LLM. Pilih penyedia, autentikasi, lalu atur model default sebagai `provider/model`.

Mencari dokumentasi saluran chat (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/dll.)? Lihat [Channels](/id/channels).

## Mulai cepat

1. Autentikasi dengan penyedia (biasanya melalui `openclaw onboard`).
2. Atur model default:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Dokumentasi provider

- [Alibaba Model Studio](/id/providers/alibaba)
- [Amazon Bedrock](/id/providers/bedrock)
- [Anthropic (API + Claude CLI)](/id/providers/anthropic)
- [Arcee AI (model Trinity)](/id/providers/arcee)
- [BytePlus (Internasional)](/id/concepts/model-providers#byteplus-international)
- [Chutes](/id/providers/chutes)
- [ComfyUI](/id/providers/comfy)
- [Cloudflare AI Gateway](/id/providers/cloudflare-ai-gateway)
- [DeepSeek](/id/providers/deepseek)
- [fal](/id/providers/fal)
- [Fireworks](/id/providers/fireworks)
- [GitHub Copilot](/id/providers/github-copilot)
- [Model GLM](/id/providers/glm)
- [Google (Gemini)](/id/providers/google)
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
- [SGLang (model lokal)](/id/providers/sglang)
- [StepFun](/id/providers/stepfun)
- [Synthetic](/id/providers/synthetic)
- [Together AI](/id/providers/together)
- [Venice (Venice AI, berfokus pada privasi)](/id/providers/venice)
- [Vercel AI Gateway](/id/providers/vercel-ai-gateway)
- [Vydra](/id/providers/vydra)
- [vLLM (model lokal)](/id/providers/vllm)
- [Volcengine (Doubao)](/id/providers/volcengine)
- [xAI](/id/providers/xai)
- [Xiaomi](/id/providers/xiaomi)
- [Z.AI](/id/providers/zai)

## Halaman ringkasan bersama

- [Varian bundel tambahan](/id/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy, dan Gemini CLI OAuth
- [Pembuatan Gambar](/id/tools/image-generation) - Tool `image_generate` bersama, pemilihan provider, dan failover
- [Pembuatan Musik](/id/tools/music-generation) - Tool `music_generate` bersama, pemilihan provider, dan failover
- [Pembuatan Video](/id/tools/video-generation) - Tool `video_generate` bersama, pemilihan provider, dan failover

## Provider transkripsi

- [Deepgram (transkripsi audio)](/id/providers/deepgram)

## Tool komunitas

- [Claude Max API Proxy](/id/providers/claude-max-api-proxy) - Proxy komunitas untuk kredensial langganan Claude (verifikasi kebijakan/persyaratan Anthropic sebelum digunakan)

Untuk katalog provider lengkap (xAI, Groq, Mistral, dll.) dan konfigurasi lanjutan,
lihat [Penyedia model](/id/concepts/model-providers).
