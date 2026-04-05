---
read_when:
    - Chcesz używać Vercel AI Gateway z OpenClaw
    - Potrzebujesz zmiennej env klucza API albo opcji auth w CLI
summary: Konfiguracja Vercel AI Gateway (auth + wybór modelu)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-05T14:03:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: f30768dc3db49708b25042d317906f7ad9a2c72b0fa03263bc04f5eefbf7a507
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway) zapewnia zunifikowane API do uzyskiwania dostępu do setek modeli przez jeden endpoint.

- Provider: `vercel-ai-gateway`
- Uwierzytelnianie: `AI_GATEWAY_API_KEY`
- API: zgodne z Anthropic Messages
- OpenClaw automatycznie wykrywa katalog Gateway `/v1/models`, więc `/models vercel-ai-gateway`
  zawiera bieżące referencje modeli, takie jak `vercel-ai-gateway/openai/gpt-5.4`.

## Szybki start

1. Ustaw klucz API (zalecane: zapisz go dla Gateway):

```bash
openclaw onboard --auth-choice ai-gateway-api-key
```

2. Ustaw model domyślny:

```json5
{
  agents: {
    defaults: {
      model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
    },
  },
}
```

## Przykład nieinteraktywny

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Uwaga dotycząca środowiska

Jeśli Gateway działa jako daemon (launchd/systemd), upewnij się, że `AI_GATEWAY_API_KEY`
jest dostępny dla tego procesu (na przykład w `~/.openclaw/.env` albo przez
`env.shellEnv`).

## Skrócony format ID modeli

OpenClaw akceptuje skrócone referencje modeli Claude w Vercel i normalizuje je
w runtime:

- `vercel-ai-gateway/claude-opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4.6`
- `vercel-ai-gateway/opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4-6`
