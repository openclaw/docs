---
read_when:
    - Vuoi l'accesso ai modelli ospitati da OpenCode
    - Vuoi scegliere tra i cataloghi Zen e Go
summary: Usa i cataloghi OpenCode Zen e Go con OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-05T14:01:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: c23bc99208d9275afcb1731c28eee250c9f4b7d0578681ace31416135c330865
    source_path: providers/opencode.md
    workflow: 15
---

# OpenCode

OpenCode espone due cataloghi ospitati in OpenClaw:

- `opencode/...` per il catalogo **Zen**
- `opencode-go/...` per il catalogo **Go**

Entrambi i cataloghi usano la stessa chiave API OpenCode. OpenClaw mantiene separati
gli id dei provider runtime così l'instradamento upstream per modello resta corretto, ma onboarding e documentazione li trattano
come un'unica configurazione OpenCode.

## Configurazione CLI

### Catalogo Zen

```bash
openclaw onboard --auth-choice opencode-zen
openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
```

### Catalogo Go

```bash
openclaw onboard --auth-choice opencode-go
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## Frammento di configurazione

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Cataloghi

### Zen

- Provider runtime: `opencode`
- Modelli di esempio: `opencode/claude-opus-4-6`, `opencode/gpt-5.4`, `opencode/gemini-3-pro`
- Ideale quando vuoi il proxy multi-modello OpenCode selezionato

### Go

- Provider runtime: `opencode-go`
- Modelli di esempio: `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5`
- Ideale quando vuoi la gamma Kimi/GLM/MiniMax ospitata da OpenCode

## Note

- È supportato anche `OPENCODE_ZEN_API_KEY`.
- Inserire una chiave OpenCode durante la configurazione memorizza le credenziali per entrambi i provider runtime.
- Accedi a OpenCode, aggiungi i dettagli di fatturazione e copia la tua chiave API.
- La fatturazione e la disponibilità dei cataloghi vengono gestite dalla dashboard OpenCode.
- I riferimenti OpenCode basati su Gemini restano sul percorso proxy-Gemini, quindi OpenClaw mantiene
  lì la sanitizzazione della thought-signature di Gemini senza abilitare la validazione nativa del replay
  Gemini o le riscritture bootstrap.
- I riferimenti OpenCode non-Gemini mantengono la policy minima di replay compatibile con OpenAI.
