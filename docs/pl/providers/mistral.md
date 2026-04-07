---
read_when:
    - Chcesz używać modeli Mistral w OpenClaw
    - Potrzebujesz onboardingu klucza API Mistral i odwołań do modeli
summary: Używaj modeli Mistral i transkrypcji Voxtral z OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-07T09:49:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e32a0eb2a37dba6383ba338b06a8d0be600e7443aa916225794ccb0fdf46aee
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw obsługuje Mistral zarówno do routingu modeli tekstowych/obrazowych (`mistral/...`), jak i
do transkrypcji audio przez Voxtral w media understanding.
Mistral może być również używany do embeddingów pamięci (`memorySearch.provider = "mistral"`).

## Konfiguracja CLI

```bash
openclaw onboard --auth-choice mistral-api-key
# or non-interactive
openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
```

## Fragment konfiguracji (dostawca LLM)

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
}
```

## Wbudowany katalog LLM

OpenClaw obecnie udostępnia ten dołączony katalog Mistral:

| Model ref                        | Wejście      | Kontekst | Maks. wyjście | Uwagi                                                           |
| -------------------------------- | ------------ | -------- | ------------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | tekst, obraz | 262,144  | 16,384        | Model domyślny                                                   |
| `mistral/mistral-medium-2508`    | tekst, obraz | 262,144  | 8,192         | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | tekst, obraz | 128,000  | 16,384        | Mistral Small 4; regulowane reasoning przez API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | tekst, obraz | 128,000  | 32,768        | Pixtral                                                          |
| `mistral/codestral-latest`       | tekst        | 256,000  | 4,096         | Kodowanie                                                        |
| `mistral/devstral-medium-latest` | tekst        | 262,144  | 32,768        | Devstral 2                                                       |
| `mistral/magistral-small`        | tekst        | 128,000  | 40,000        | Z włączonym reasoning                                            |

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

## Regulowane reasoning (`mistral-small-latest`)

`mistral/mistral-small-latest` odpowiada Mistral Small 4 i obsługuje [regulowane reasoning](https://docs.mistral.ai/capabilities/reasoning/adjustable) w API Chat Completions przez `reasoning_effort` (`none` minimalizuje dodatkowe myślenie w wyniku; `high` ujawnia pełne ślady myślenia przed końcową odpowiedzią).

OpenClaw mapuje poziom **thinking** sesji na API Mistral:

- **off** / **minimal** → `none`
- **low** / **medium** / **high** / **xhigh** / **adaptive** → `high`

Inne modele z dołączonego katalogu Mistral nie używają tego parametru; nadal używaj modeli `magistral-*`, gdy chcesz uzyskać natywne dla Mistral zachowanie z priorytetem reasoning.

## Uwagi

- Uwierzytelnianie Mistral używa `MISTRAL_API_KEY`.
- Bazowy URL dostawcy domyślnie to `https://api.mistral.ai/v1`.
- Domyślny model onboardingu to `mistral/mistral-large-latest`.
- Domyślny model audio dla media-understanding w Mistral to `voxtral-mini-latest`.
- Ścieżka transkrypcji mediów używa `/v1/audio/transcriptions`.
- Ścieżka embeddingów pamięci używa `/v1/embeddings` (model domyślny: `mistral-embed`).
