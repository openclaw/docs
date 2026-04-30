---
read_when:
    - Anda ingin memilih penyedia model
    - Anda menginginkan contoh penyiapan cepat untuk autentikasi LLM + pemilihan model
summary: Penyedia model (LLM) yang didukung oleh OpenClaw
title: Mulai cepat penyedia model
x-i18n:
    generated_at: "2026-04-30T10:07:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f71f9ab34df2b545128bfeed3cab82f31b741d4a66263113068568ce6b77cd6
    source_path: providers/models.md
    workflow: 16
---

# Penyedia Model

OpenClaw dapat menggunakan banyak penyedia LLM. Pilih salah satu, autentikasi, lalu tetapkan model default sebagai `provider/model`.

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
- [Amazon Bedrock](/id/providers/bedrock)
- [Anthropic (API + Claude CLI)](/id/providers/anthropic)
- [BytePlus (Internasional)](/id/concepts/model-providers#byteplus-international)
- [Chutes](/id/providers/chutes)
- [ComfyUI](/id/providers/comfy)
- [Cloudflare AI Gateway](/id/providers/cloudflare-ai-gateway)
- [DeepInfra](/id/providers/deepinfra)
- [fal](/id/providers/fal)
- [Fireworks](/id/providers/fireworks)
- [model GLM](/id/providers/glm)
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

## Varian penyedia bundel tambahan

- `anthropic-vertex` - dukungan Anthropic implisit di Google Vertex saat kredensial Vertex tersedia; tidak ada pilihan autentikasi onboarding terpisah
- `copilot-proxy` - jembatan Proxy Copilot VS Code lokal; gunakan `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - alur OAuth Gemini CLI tidak resmi; memerlukan instalasi `gemini` lokal (`brew install gemini-cli` atau `npm install -g @google/gemini-cli`); model default `google-gemini-cli/gemini-3-flash-preview`; gunakan `openclaw onboard --auth-choice google-gemini-cli` atau `openclaw models auth login --provider google-gemini-cli --set-default`

Untuk katalog penyedia lengkap (xAI, Groq, Mistral, dll.) dan konfigurasi lanjutan, lihat [Penyedia model](/id/concepts/model-providers).

## Terkait

- [Pemilihan model](/id/concepts/model-providers)
- [Failover model](/id/concepts/model-failover)
- [CLI model](/id/cli/models)
