---
read_when:
    - Chcesz używać modeli Mistral w OpenClaw
    - Potrzebujesz onboardingu klucza API Mistral i referencji modeli
summary: Używanie modeli Mistral i transkrypcji Voxtral z OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-05T14:03:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f61b9e0656dd7e0243861ddf14b1b41a07c38bff27cef9ad0815d14c8e34408
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw obsługuje Mistral zarówno dla routingu modeli tekstowych/obrazowych (`mistral/...`), jak i
dla transkrypcji audio przez Voxtral w media understanding.
Mistral może być także używany do embeddingów pamięci (`memorySearch.provider = "mistral"`).

## Konfiguracja CLI

```bash
openclaw onboard --auth-choice mistral-api-key
# lub nieinteraktywnie
openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
```

## Fragment konfiguracji (provider LLM)

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
}
```

## Wbudowany katalog LLM

OpenClaw obecnie dostarcza taki dołączony katalog Mistral:

| Ref modelu                       | Wejście      | Kontekst | Max output | Uwagi                    |
| -------------------------------- | ------------ | -------- | ---------- | ------------------------ |
| `mistral/mistral-large-latest`   | text, image  | 262,144  | 16,384     | Model domyślny           |
| `mistral/mistral-medium-2508`    | text, image  | 262,144  | 8,192      | Mistral Medium 3.1       |
| `mistral/mistral-small-latest`   | text, image  | 128,000  | 16,384     | Mniejszy model multimodalny |
| `mistral/pixtral-large-latest`   | text, image  | 128,000  | 32,768     | Pixtral                  |
| `mistral/codestral-latest`       | text         | 256,000  | 4,096      | Kodowanie                |
| `mistral/devstral-medium-latest` | text         | 262,144  | 32,768     | Devstral 2               |
| `mistral/magistral-small`        | text         | 128,000  | 40,000     | Z obsługą reasoning      |

## Fragment konfiguracji (transkrypcja audio z Voxtral)

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

## Uwagi

- Uwierzytelnianie Mistral używa `MISTRAL_API_KEY`.
- Base URL providera domyślnie ma wartość `https://api.mistral.ai/v1`.
- Domyślny model onboardingu to `mistral/mistral-large-latest`.
- Domyślny model audio media-understanding dla Mistral to `voxtral-mini-latest`.
- Ścieżka transkrypcji mediów używa `/v1/audio/transcriptions`.
- Ścieżka embeddingów pamięci używa `/v1/embeddings` (domyślny model: `mistral-embed`).
