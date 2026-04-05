---
read_when:
    - Anda ingin memilih provider model
    - Anda menginginkan contoh penyiapan cepat untuk auth LLM + pemilihan model
summary: Provider model (LLM) yang didukung oleh OpenClaw
title: Mulai Cepat Provider Model
x-i18n:
    generated_at: "2026-04-05T14:03:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83e372193b476c7cee6eb9f5c443b03563d863043f47c633ac0096bca642cc6f
    source_path: providers/models.md
    workflow: 15
---

# Provider Model

OpenClaw dapat menggunakan banyak provider LLM. Pilih satu, autentikasi, lalu setel
model default sebagai `provider/model`.

## Mulai cepat (dua langkah)

1. Autentikasi dengan provider (biasanya melalui `openclaw onboard`).
2. Setel model default:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Provider yang didukung (set awal)

- [Anthropic (API + Claude CLI)](/providers/anthropic)
- [Amazon Bedrock](/providers/bedrock)
- [BytePlus (Internasional)](/id/concepts/model-providers#byteplus-international)
- [Chutes](/providers/chutes)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [Fireworks](/providers/fireworks)
- [Model GLM](/providers/glm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [OpenAI (API + Codex)](/providers/openai)
- [OpenCode (Zen + Go)](/providers/opencode)
- [OpenRouter](/providers/openrouter)
- [Qianfan](/providers/qianfan)
- [Qwen](/providers/qwen)
- [StepFun](/providers/stepfun)
- [Synthetic](/providers/synthetic)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/providers/venice)
- [xAI](/providers/xai)
- [Z.AI](/providers/zai)

## Varian provider bawaan tambahan

- `anthropic-vertex` - dukungan Anthropic implisit di Google Vertex saat kredensial Vertex tersedia; tidak ada pilihan auth onboarding terpisah
- `copilot-proxy` - bridge Copilot Proxy VS Code lokal; gunakan `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - alur OAuth Gemini CLI tidak resmi; memerlukan instalasi `gemini` lokal (`brew install gemini-cli` atau `npm install -g @google/gemini-cli`); model default `google-gemini-cli/gemini-3.1-pro-preview`; gunakan `openclaw onboard --auth-choice google-gemini-cli` atau `openclaw models auth login --provider google-gemini-cli --set-default`

Untuk katalog provider lengkap (xAI, Groq, Mistral, dll.) dan konfigurasi lanjutan,
lihat [provider model](/id/concepts/model-providers).
