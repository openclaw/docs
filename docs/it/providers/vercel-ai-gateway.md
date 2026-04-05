---
read_when:
    - Vuoi usare Vercel AI Gateway con OpenClaw
    - Ti servono la variabile d'ambiente della chiave API o la scelta di autenticazione CLI
summary: Configurazione di Vercel AI Gateway (autenticazione + selezione del modello)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-05T14:02:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: f30768dc3db49708b25042d317906f7ad9a2c72b0fa03263bc04f5eefbf7a507
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

Il [Vercel AI Gateway](https://vercel.com/ai-gateway) fornisce un'API unificata per accedere a centinaia di modelli tramite un singolo endpoint.

- Provider: `vercel-ai-gateway`
- Autenticazione: `AI_GATEWAY_API_KEY`
- API: compatibile con Anthropic Messages
- OpenClaw rileva automaticamente il catalogo `/v1/models` del Gateway, quindi `/models vercel-ai-gateway`
  include riferimenti di modello correnti come `vercel-ai-gateway/openai/gpt-5.4`.

## Avvio rapido

1. Imposta la chiave API (consigliato: salvala per il Gateway):

```bash
openclaw onboard --auth-choice ai-gateway-api-key
```

2. Imposta un modello predefinito:

```json5
{
  agents: {
    defaults: {
      model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
    },
  },
}
```

## Esempio non interattivo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Nota sull'ambiente

Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `AI_GATEWAY_API_KEY`
sia disponibile per quel processo (ad esempio in `~/.openclaw/.env` o tramite
`env.shellEnv`).

## Forma abbreviata degli ID modello

OpenClaw accetta riferimenti abbreviati ai modelli Claude di Vercel e li normalizza a
runtime:

- `vercel-ai-gateway/claude-opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4.6`
- `vercel-ai-gateway/opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4-6`
