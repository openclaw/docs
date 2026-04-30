---
read_when:
    - Chcesz używać Cerebras z OpenClaw
    - Potrzebujesz zmiennej środowiskowej klucza API Cerebras albo wyboru uwierzytelniania CLI
summary: Konfiguracja Cerebras (uwierzytelnianie + wybór modelu)
title: Cerebras
x-i18n:
    generated_at: "2026-04-30T10:12:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96f94b23e55340414633ff48e352623907ee36dd2715e5ab053a93c86df1b49a
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) zapewnia szybkie wnioskowanie zgodne z OpenAI.

| Właściwość | Wartość                     |
| ---------- | --------------------------- |
| Dostawca   | `cerebras`                  |
| Uwierzytelnianie | `CEREBRAS_API_KEY`     |
| API        | zgodne z OpenAI             |
| Bazowy URL | `https://api.cerebras.ai/v1` |

## Pierwsze kroki

<Steps>
  <Step title="Uzyskaj klucz API">
    Utwórz klucz API w [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Uruchom onboarding">
    ```bash
    openclaw onboard --auth-choice cerebras-api-key
    ```
  </Step>
  <Step title="Sprawdź, czy modele są dostępne">
    ```bash
    openclaw models list --provider cerebras
    ```
  </Step>
</Steps>

### Konfiguracja nieinteraktywna

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## Wbudowany katalog

OpenClaw zawiera statyczny katalog Cerebras dla publicznego punktu końcowego zgodnego z OpenAI:

| Odwołanie do modelu                       | Nazwa                | Uwagi                                           |
| ----------------------------------------- | -------------------- | ----------------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | Model domyślny; model rozumowania w wersji preview |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | Produkcyjny model rozumowania                   |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | Model bez rozumowania w wersji preview          |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | Produkcyjny model zoptymalizowany pod kątem szybkości |

<Warning>
Cerebras oznacza `zai-glm-4.7` i `qwen-3-235b-a22b-instruct-2507` jako modele w wersji preview, a `llama3.1-8b` / `qwen-3-235b-a22b-instruct-2507` są udokumentowane jako przeznaczone do wycofania 27 maja 2026 r. Przed użyciem ich w produkcji sprawdź stronę obsługiwanych modeli Cerebras.
</Warning>

## Ręczna konfiguracja

Dołączony Plugin zwykle oznacza, że potrzebujesz tylko klucza API. Użyj jawnej
konfiguracji `models.providers.cerebras`, gdy chcesz nadpisać metadane modelu:

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że `CEREBRAS_API_KEY`
jest dostępny dla tego procesu, na przykład w `~/.openclaw/.env` lub przez
`env.shellEnv`.
</Note>
