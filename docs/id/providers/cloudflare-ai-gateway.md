---
read_when:
    - Anda ingin menggunakan Cloudflare AI Gateway dengan OpenClaw
    - Anda memerlukan account ID, gateway ID, atau variabel lingkungan API key
summary: Penyiapan Cloudflare AI Gateway (auth + pemilihan model)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-05T14:03:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: db77652c37652ca20f7c50f32382dbaeaeb50ea5bdeaf1d4fd17dc394e58950c
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

# Cloudflare AI Gateway

Cloudflare AI Gateway berada di depan API provider dan memungkinkan Anda menambahkan analitik, cache, dan kontrol. Untuk Anthropic, OpenClaw menggunakan Anthropic Messages API melalui endpoint Gateway Anda.

- Provider: `cloudflare-ai-gateway`
- Base URL: `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`
- Model default: `cloudflare-ai-gateway/claude-sonnet-4-5`
- API key: `CLOUDFLARE_AI_GATEWAY_API_KEY` (API key provider Anda untuk permintaan melalui Gateway)

Untuk model Anthropic, gunakan Anthropic API key Anda.

## Mulai cepat

1. Setel API key provider dan detail Gateway:

```bash
openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
```

2. Setel model default:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-5" },
    },
  },
}
```

## Contoh non-interaktif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Gateway terautentikasi

Jika Anda mengaktifkan autentikasi Gateway di Cloudflare, tambahkan header `cf-aig-authorization` (ini berlaku selain provider API key Anda).

```json5
{
  models: {
    providers: {
      "cloudflare-ai-gateway": {
        headers: {
          "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
        },
      },
    },
  },
}
```

## Catatan lingkungan

Jika Gateway berjalan sebagai daemon (launchd/systemd), pastikan `CLOUDFLARE_AI_GATEWAY_API_KEY` tersedia untuk proses tersebut (misalnya, di `~/.openclaw/.env` atau melalui `env.shellEnv`).
