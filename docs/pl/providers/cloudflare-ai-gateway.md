---
read_when:
    - Chcesz używać Cloudflare AI Gateway z OpenClaw
    - Potrzebujesz ID konta, ID gateway albo zmiennej env klucza API
summary: Konfiguracja Cloudflare AI Gateway (auth + wybór modelu)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-05T14:02:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: db77652c37652ca20f7c50f32382dbaeaeb50ea5bdeaf1d4fd17dc394e58950c
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

# Cloudflare AI Gateway

Cloudflare AI Gateway działa przed API providerów i pozwala dodać analitykę, cache oraz kontrolę. W przypadku Anthropic OpenClaw używa Anthropic Messages API przez endpoint Twojej Gateway.

- Provider: `cloudflare-ai-gateway`
- Base URL: `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`
- Model domyślny: `cloudflare-ai-gateway/claude-sonnet-4-5`
- Klucz API: `CLOUDFLARE_AI_GATEWAY_API_KEY` (Twój klucz API providera dla żądań przechodzących przez Gateway)

Dla modeli Anthropic użyj swojego klucza API Anthropic.

## Szybki start

1. Ustaw klucz API providera i szczegóły Gateway:

```bash
openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
```

2. Ustaw model domyślny:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-5" },
    },
  },
}
```

## Przykład nieinteraktywny

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Gateway z uwierzytelnianiem

Jeśli włączyłeś uwierzytelnianie Gateway w Cloudflare, dodaj nagłówek `cf-aig-authorization` (oprócz klucza API providera).

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

## Uwaga dotycząca środowiska

Jeśli Gateway działa jako daemon (launchd/systemd), upewnij się, że `CLOUDFLARE_AI_GATEWAY_API_KEY` jest dostępny dla tego procesu (na przykład w `~/.openclaw/.env` albo przez `env.shellEnv`).
