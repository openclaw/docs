---
read_when:
    - Anda ingin menggunakan Vercel AI Gateway dengan OpenClaw
    - Anda memerlukan env var API key atau pilihan auth CLI
summary: Setup Vercel AI Gateway (auth + pemilihan model)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-05T14:04:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: f30768dc3db49708b25042d317906f7ad9a2c72b0fa03263bc04f5eefbf7a507
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway) menyediakan API terpadu untuk mengakses ratusan model melalui satu endpoint.

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- API: kompatibel dengan Anthropic Messages
- OpenClaw secara otomatis menemukan katalog Gateway `/v1/models`, sehingga `/models vercel-ai-gateway`
  mencakup ref model saat ini seperti `vercel-ai-gateway/openai/gpt-5.4`.

## Mulai cepat

1. Setel API key (disarankan: simpan untuk Gateway):

```bash
openclaw onboard --auth-choice ai-gateway-api-key
```

2. Setel model default:

```json5
{
  agents: {
    defaults: {
      model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
    },
  },
}
```

## Contoh non-interaktif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Catatan environment

Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `AI_GATEWAY_API_KEY`
tersedia untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui
`env.shellEnv`).

## Singkatan ID model

OpenClaw menerima ref model singkat Claude untuk Vercel dan menormalisasikannya saat
runtime:

- `vercel-ai-gateway/claude-opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4.6`
- `vercel-ai-gateway/opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4-6`
