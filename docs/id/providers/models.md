---
read_when:
    - Anda ingin memilih penyedia model
    - Anda menginginkan contoh penyiapan cepat untuk autentikasi LLM + pemilihan model
summary: Penyedia model (LLM) yang didukung oleh OpenClaw
title: Panduan memulai cepat penyedia model
x-i18n:
    generated_at: "2026-07-19T05:08:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3988d6985cbe203a6a3357d59160190990b1b53245ea25f1538dbc6f567afec1
    source_path: providers/models.md
    workflow: 16
---

Pilih penyedia, lakukan autentikasi, lalu tetapkan model default sebagai `provider/model`.

## Mulai cepat (dua langkah)

1. Lakukan autentikasi dengan penyedia (biasanya melalui `openclaw onboard`).
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
- [Baseten (Inkling + API Model)](/providers/baseten)
- [BytePlus (Internasional)](/id/concepts/model-providers#byteplus-international)
- [Chutes](/id/providers/chutes)
- [Cloudflare AI Gateway](/id/providers/cloudflare-ai-gateway)
- [Cohere](/id/providers/cohere)
- [ComfyUI](/id/providers/comfy)
- [DeepInfra](/id/providers/deepinfra)
- [fal](/id/providers/fal)
- [Fireworks](/id/providers/fireworks)
- [MiniMax](/id/providers/minimax)
- [Mistral](/id/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/id/providers/moonshot)
- [NovitaAI](/id/providers/novita)
- [OpenAI (API + Codex)](/id/providers/openai)
- [OpenCode (Zen + Go)](/id/providers/opencode)
- [OpenRouter](/id/providers/openrouter)
- [Qianfan](/id/providers/qianfan)
- [Qwen](/id/providers/qwen)
- [Runway](/id/providers/runway)
- [StepFun](/id/providers/stepfun)
- [Synthetic](/id/providers/synthetic)
- [Venice (Venice AI)](/id/providers/venice)
- [Vercel AI Gateway](/id/providers/vercel-ai-gateway)
- [xAI](/id/providers/xai)
- [Z.AI (GLM)](/id/providers/zai)

Untuk katalog penyedia lengkap dan konfigurasi lanjutan, lihat
[Direktori penyedia](/id/providers/index) dan [Penyedia model](/id/concepts/model-providers).

## Varian penyedia tambahan

- `anthropic-vertex` - instal `@openclaw/anthropic-vertex-provider` untuk dukungan Anthropic implisit di Google Vertex ketika kredensial Vertex tersedia; tidak ada pilihan autentikasi orientasi awal yang terpisah
- `copilot-proxy` - jembatan Proksi Copilot VS Code lokal; gunakan `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - alur OAuth Gemini CLI tidak resmi; memerlukan instalasi lokal `gemini` (`brew install gemini-cli` atau `npm install -g @google/gemini-cli`); model default `google-gemini-cli/gemini-3-flash-preview`; gunakan `openclaw onboard --auth-choice google-gemini-cli` atau `openclaw models auth login --provider google-gemini-cli --set-default`

## Terkait

- [Direktori penyedia](/id/providers/index)
- [Pemilihan model](/id/concepts/model-providers)
- [Failover model](/id/concepts/model-failover)
- [CLI model](/id/cli/models)
