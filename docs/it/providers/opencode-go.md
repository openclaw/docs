---
read_when:
    - Vuoi il catalogo OpenCode Go
    - Hai bisogno dei ref modello runtime per i modelli ospitati da Go
summary: Usa il catalogo OpenCode Go con la configurazione OpenCode condivisa
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-05T14:01:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8650af7c64220c14bab8c22472fff8bebd7abde253e972b6a11784ad833d321c
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go è il catalogo Go all'interno di [OpenCode](/providers/opencode).
Usa la stessa `OPENCODE_API_KEY` del catalogo Zen, ma mantiene l'ID provider
runtime `opencode-go` così l'instradamento upstream per modello resta corretto.

## Modelli supportati

- `opencode-go/kimi-k2.5`
- `opencode-go/glm-5`
- `opencode-go/minimax-m2.5`

## Configurazione CLI

```bash
openclaw onboard --auth-choice opencode-go
# oppure in modalità non interattiva
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## Frammento di config

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Comportamento di instradamento

OpenClaw gestisce automaticamente l'instradamento per modello quando il ref modello usa `opencode-go/...`.

## Note

- Usa [OpenCode](/providers/opencode) per la panoramica condivisa di onboarding e catalogo.
- I ref runtime restano espliciti: `opencode/...` per Zen, `opencode-go/...` per Go.
