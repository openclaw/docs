---
read_when:
    - Vuoi i modelli GLM in OpenClaw
    - Hai bisogno della convenzione di naming dei modelli e del setup
summary: Panoramica della famiglia di modelli GLM + come usarla in OpenClaw
title: Modelli GLM
x-i18n:
    generated_at: "2026-04-05T14:01:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59622edab5094d991987f9788fbf08b33325e737e7ff88632b0c3ac89412d4c7
    source_path: providers/glm.md
    workflow: 15
---

# Modelli GLM

GLM è una **famiglia di modelli** (non un'azienda) disponibile tramite la piattaforma Z.AI. In OpenClaw, i modelli
GLM sono accessibili tramite il provider `zai` e ID modello come `zai/glm-5`.

## Setup CLI

```bash
# Setup generico con chiave API e rilevamento automatico dell'endpoint
openclaw onboard --auth-choice zai-api-key

# Coding Plan Global, consigliato per gli utenti Coding Plan
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN (regione Cina), consigliato per gli utenti Coding Plan
openclaw onboard --auth-choice zai-coding-cn

# API generale
openclaw onboard --auth-choice zai-global

# API generale CN (regione Cina)
openclaw onboard --auth-choice zai-cn
```

## Snippet di configurazione

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

`zai-api-key` consente a OpenClaw di rilevare l'endpoint Z.AI corrispondente dalla chiave e
applicare automaticamente il base URL corretto. Usa le scelte regionali esplicite quando
vuoi forzare una specifica superficie Coding Plan o API generale.

## Modelli GLM bundled attuali

OpenClaw attualmente inizializza il provider bundled `zai` con questi riferimenti GLM:

- `glm-5.1`
- `glm-5`
- `glm-5-turbo`
- `glm-5v-turbo`
- `glm-4.7`
- `glm-4.7-flash`
- `glm-4.7-flashx`
- `glm-4.6`
- `glm-4.6v`
- `glm-4.5`
- `glm-4.5-air`
- `glm-4.5-flash`
- `glm-4.5v`

## Note

- Le versioni e la disponibilità di GLM possono cambiare; consulta la documentazione di Z.AI per le novità.
- Il riferimento di modello bundled predefinito è `zai/glm-5`.
- Per i dettagli del provider, vedi [/providers/zai](/providers/zai).
