---
read_when:
    - Vuoi usare i modelli Mistral in OpenClaw
    - Ti servono onboarding con chiave API Mistral e model ref
summary: Usare i modelli Mistral e la trascrizione Voxtral con OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-07T08:16:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e32a0eb2a37dba6383ba338b06a8d0be600e7443aa916225794ccb0fdf46aee
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw supporta Mistral sia per l'instradamento di modelli testo/immagine (`mistral/...`) sia
per la trascrizione audio tramite Voxtral in media understanding.
Mistral può anche essere usato per embedding di memoria (`memorySearch.provider = "mistral"`).

## Configurazione CLI

```bash
openclaw onboard --auth-choice mistral-api-key
# oppure non interattivo
openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
```

## Frammento di configurazione (provider LLM)

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
}
```

## Catalogo LLM incluso

OpenClaw attualmente include questo catalogo Mistral integrato:

| Model ref                        | Input       | Contesto | Output max | Note                                                             |
| -------------------------------- | ----------- | -------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | text, image | 262,144  | 16,384     | Modello predefinito                                              |
| `mistral/mistral-medium-2508`    | text, image | 262,144  | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | text, image | 128,000  | 16,384     | Mistral Small 4; reasoning regolabile tramite API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | text, image | 128,000  | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | text        | 256,000  | 4,096      | Coding                                                           |
| `mistral/devstral-medium-latest` | text        | 262,144  | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | text        | 128,000  | 40,000     | Reasoning abilitato                                              |

## Frammento di configurazione (trascrizione audio con Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

## Reasoning regolabile (`mistral-small-latest`)

`mistral/mistral-small-latest` corrisponde a Mistral Small 4 e supporta il [reasoning regolabile](https://docs.mistral.ai/capabilities/reasoning/adjustable) sull'API Chat Completions tramite `reasoning_effort` (`none` riduce al minimo il thinking aggiuntivo nell'output; `high` mostra tracce complete di thinking prima della risposta finale).

OpenClaw mappa il livello di **thinking** della sessione all'API di Mistral:

- **off** / **minimal** → `none`
- **low** / **medium** / **high** / **xhigh** / **adaptive** → `high`

Gli altri modelli del catalogo Mistral incluso non usano questo parametro; continua a usare i modelli `magistral-*` quando vuoi il comportamento nativo di Mistral orientato prima al reasoning.

## Note

- L'autenticazione Mistral usa `MISTRAL_API_KEY`.
- L'URL di base del provider è per default `https://api.mistral.ai/v1`.
- Il modello predefinito dell'onboarding è `mistral/mistral-large-latest`.
- Il modello audio predefinito di media-understanding per Mistral è `voxtral-mini-latest`.
- Il percorso di trascrizione media usa `/v1/audio/transcriptions`.
- Il percorso per gli embedding di memoria usa `/v1/embeddings` (modello predefinito: `mistral-embed`).
