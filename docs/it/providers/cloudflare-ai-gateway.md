---
read_when:
    - Vuoi usare Cloudflare AI Gateway con OpenClaw
    - Ti servono l'ID account, il gateway ID o la variabile d'ambiente della chiave API
summary: Configurazione di Cloudflare AI Gateway (autenticazione + selezione del modello)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-05T14:01:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: db77652c37652ca20f7c50f32382dbaeaeb50ea5bdeaf1d4fd17dc394e58950c
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

# Cloudflare AI Gateway

Cloudflare AI Gateway si colloca davanti alle API dei provider e ti consente di aggiungere analytics, caching e controlli. Per Anthropic, OpenClaw usa l'API Anthropic Messages tramite il tuo endpoint Gateway.

- Provider: `cloudflare-ai-gateway`
- URL di base: `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`
- Modello predefinito: `cloudflare-ai-gateway/claude-sonnet-4-5`
- Chiave API: `CLOUDFLARE_AI_GATEWAY_API_KEY` (la tua chiave API del provider per le richieste tramite il Gateway)

Per i modelli Anthropic, usa la tua chiave API Anthropic.

## Avvio rapido

1. Imposta la chiave API del provider e i dettagli del Gateway:

```bash
openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
```

2. Imposta un modello predefinito:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-5" },
    },
  },
}
```

## Esempio non interattivo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Gateway autenticati

Se hai abilitato l'autenticazione Gateway in Cloudflare, aggiungi l'header `cf-aig-authorization` (questo si aggiunge alla chiave API del provider).

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

## Nota sull'ambiente

Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `CLOUDFLARE_AI_GATEWAY_API_KEY` sia disponibile per quel processo (ad esempio in `~/.openclaw/.env` o tramite `env.shellEnv`).
