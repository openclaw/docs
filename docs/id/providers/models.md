---
read_when:
    - Anda ingin memilih penyedia model
    - Anda ingin contoh penyiapan cepat untuk auth LLM + pemilihan model
summary: Penyedia model (LLM) yang didukung oleh OpenClaw
title: Panduan Cepat Penyedia Model
x-i18n:
    generated_at: "2026-04-08T02:16:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59ee4c2f993fe0ae05fe34f52bc6f3e0fc9a76b10760f56b20ad251e25ee9f20
    source_path: providers/models.md
    workflow: 15
---

# Penyedia Model

OpenClaw dapat menggunakan banyak penyedia LLM. Pilih satu, autentikasi, lalu tetapkan model default
sebagai `provider/model`.

## Mulai cepat (dua langkah)

1. Autentikasi dengan penyedia (biasanya melalui `openclaw onboard`).
2. Tetapkan model default:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Penyedia yang didukung (set awal)

- [Alibaba Model Studio](/id/providers/alibaba)
- [Anthropic (API + Claude CLI)](/id/providers/anthropic)
- [Amazon Bedrock](/id/providers/bedrock)
- [BytePlus (Internasional)](/id/concepts/model-providers#byteplus-international)
- [Chutes](/id/providers/chutes)
- [ComfyUI](/id/providers/comfy)
- [Cloudflare AI Gateway](/id/providers/cloudflare-ai-gateway)
- [fal](/id/providers/fal)
- [Fireworks](/id/providers/fireworks)
- [GLM models](/id/providers/glm)
- [MiniMax](/id/providers/minimax)
- [Mistral](/id/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/id/providers/moonshot)
- [OpenAI (API + Codex)](/id/providers/openai)
- [OpenCode (Zen + Go)](/id/providers/opencode)
- [OpenRouter](/id/providers/openrouter)
- [Qianfan](/id/providers/qianfan)
- [Qwen](/id/providers/qwen)
- [Runway](/id/providers/runway)
- [StepFun](/id/providers/stepfun)
- [Synthetic](/id/providers/synthetic)
- [Vercel AI Gateway](/id/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/id/providers/venice)
- [xAI](/id/providers/xai)
- [Z.AI](/id/providers/zai)

## Varian penyedia terbundel tambahan

- `anthropic-vertex` - dukungan Anthropic implisit di Google Vertex saat kredensial Vertex tersedia; tidak ada pilihan auth onboarding terpisah
- `copilot-proxy` - bridge Copilot Proxy VS Code lokal; gunakan `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - alur OAuth Gemini CLI tidak resmi; memerlukan instalasi `gemini` lokal (`brew install gemini-cli` atau `npm install -g @google/gemini-cli`); model default `google-gemini-cli/gemini-3-flash-preview`; gunakan `openclaw onboard --auth-choice google-gemini-cli` atau `openclaw models auth login --provider google-gemini-cli --set-default`

Untuk katalog penyedia lengkap (xAI, Groq, Mistral, dll.) dan konfigurasi lanjutan,
lihat [Model providers](/id/concepts/model-providers).
