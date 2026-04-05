---
read_when:
    - Vuoi usare i modelli Mistral in OpenClaw
    - Hai bisogno dell'onboarding con chiave API Mistral e dei riferimenti ai modelli
summary: Usa i modelli Mistral e la trascrizione Voxtral con OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-05T14:01:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f61b9e0656dd7e0243861ddf14b1b41a07c38bff27cef9ad0815d14c8e34408
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw supporta Mistral sia per l'instradamento di modelli testo/immagine (`mistral/...`) sia per
la trascrizione audio tramite Voxtral nella comprensione dei media.
Mistral può anche essere usato per gli embedding della memoria (`memorySearch.provider = "mistral"`).

## Configurazione CLI

```bash
openclaw onboard --auth-choice mistral-api-key
# or non-interactive
openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
```

## Frammento di configurazione (provider LLM)

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
}
```

## Catalogo LLM integrato

OpenClaw include attualmente questo catalogo Mistral integrato:

| Riferimento modello              | Input       | Contesto | Output massimo | Note                     |
| -------------------------------- | ----------- | -------- | -------------- | ------------------------ |
| `mistral/mistral-large-latest`   | text, image | 262,144  | 16,384         | Modello predefinito      |
| `mistral/mistral-medium-2508`    | text, image | 262,144  | 8,192          | Mistral Medium 3.1       |
| `mistral/mistral-small-latest`   | text, image | 128,000  | 16,384         | Modello multimodale più piccolo |
| `mistral/pixtral-large-latest`   | text, image | 128,000  | 32,768         | Pixtral                  |
| `mistral/codestral-latest`       | text        | 256,000  | 4,096          | Coding                   |
| `mistral/devstral-medium-latest` | text        | 262,144  | 32,768         | Devstral 2               |
| `mistral/magistral-small`        | text        | 128,000  | 40,000         | Con supporto al ragionamento |

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

## Note

- L'autenticazione Mistral usa `MISTRAL_API_KEY`.
- L'URL base del provider usa per impostazione predefinita `https://api.mistral.ai/v1`.
- Il modello predefinito per l'onboarding è `mistral/mistral-large-latest`.
- Il modello audio predefinito di comprensione dei media per Mistral è `voxtral-mini-latest`.
- Il percorso di trascrizione dei media usa `/v1/audio/transcriptions`.
- Il percorso degli embedding della memoria usa `/v1/embeddings` (modello predefinito: `mistral-embed`).
