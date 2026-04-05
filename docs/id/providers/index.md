---
read_when:
    - Anda ingin memilih penyedia model
    - Anda memerlukan ikhtisar singkat backend LLM yang didukung
summary: Penyedia model (LLM) yang didukung oleh OpenClaw
title: Direktori Provider
x-i18n:
    generated_at: "2026-04-05T14:03:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 690d17c14576d454ea3cd3dcbc704470da10a2a34adfe681dab7048438f2e193
    source_path: providers/index.md
    workflow: 15
---

# Provider Model

OpenClaw dapat menggunakan banyak penyedia LLM. Pilih penyedia, autentikasi, lalu setel
model default sebagai `provider/model`.

Mencari dokumentasi channel chat (WhatsApp/Telegram/Discord/Slack/Mattermost (plugin)/dll.)? Lihat [Channels](/id/channels).

## Quick start

1. Autentikasi dengan penyedia (biasanya melalui `openclaw onboard`).
2. Setel model default:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Dokumentasi provider

- [Amazon Bedrock](/providers/bedrock)
- [Anthropic (API + Claude CLI)](/providers/anthropic)
- [BytePlus (Internasional)](/id/concepts/model-providers#byteplus-international)
- [Chutes](/providers/chutes)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [DeepSeek](/providers/deepseek)
- [Fireworks](/providers/fireworks)
- [GitHub Copilot](/providers/github-copilot)
- [Model GLM](/providers/glm)
- [Google (Gemini)](/providers/google)
- [Groq (inferensi LPU)](/providers/groq)
- [Hugging Face (Inference)](/providers/huggingface)
- [Kilocode](/providers/kilocode)
- [LiteLLM (gateway terpadu)](/providers/litellm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [NVIDIA](/providers/nvidia)
- [Ollama (model cloud + lokal)](/providers/ollama)
- [OpenAI (API + Codex)](/providers/openai)
- [OpenCode](/providers/opencode)
- [OpenCode Go](/providers/opencode-go)
- [OpenRouter](/providers/openrouter)
- [Perplexity (web search)](/providers/perplexity-provider)
- [Qianfan](/providers/qianfan)
- [Qwen Cloud](/providers/qwen)
- [Qwen / Model Studio (detail endpoint; `qwen-*` kanonis, `modelstudio-*` lama)](/providers/qwen_modelstudio)
- [SGLang (model lokal)](/providers/sglang)
- [StepFun](/providers/stepfun)
- [Synthetic](/providers/synthetic)
- [Together AI](/providers/together)
- [Venice (Venice AI, berfokus pada privasi)](/providers/venice)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [vLLM (model lokal)](/providers/vllm)
- [Volcengine (Doubao)](/providers/volcengine)
- [xAI](/providers/xai)
- [Xiaomi](/providers/xiaomi)
- [Z.AI](/providers/zai)

## Halaman ikhtisar bersama

- [Varian bawaan tambahan](/providers/models#additional-bundled-provider-variants) - Anthropic Vertex, Copilot Proxy, dan Gemini CLI OAuth

## Penyedia transkripsi

- [Deepgram (transkripsi audio)](/providers/deepgram)

## Tool komunitas

- [Claude Max API Proxy](/providers/claude-max-api-proxy) - Proxy komunitas untuk kredensial langganan Claude (verifikasi kebijakan/persyaratan Anthropic sebelum digunakan)

Untuk katalog provider lengkap (xAI, Groq, Mistral, dll.) dan konfigurasi lanjutan,
lihat [Model providers](/id/concepts/model-providers).
