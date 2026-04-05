---
read_when:
    - Chcesz kierować OpenClaw przez proxy LiteLLM
    - Potrzebujesz śledzenia kosztów, logowania lub routingu modeli przez LiteLLM
summary: Uruchamiaj OpenClaw przez LiteLLM Proxy, aby uzyskać ujednolicony dostęp do modeli i śledzenie kosztów
title: LiteLLM
x-i18n:
    generated_at: "2026-04-05T14:03:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e8ca73458186285bc06967b397b8a008791dc58eea1159d6c358e1a794982d1
    source_path: providers/litellm.md
    workflow: 15
---

# LiteLLM

[LiteLLM](https://litellm.ai) to bramka LLM typu open source, która zapewnia ujednolicone API do ponad 100 dostawców modeli. Kieruj OpenClaw przez LiteLLM, aby uzyskać scentralizowane śledzenie kosztów, logowanie i elastyczność przełączania backendów bez zmiany konfiguracji OpenClaw.

## Dlaczego warto używać LiteLLM z OpenClaw?

- **Śledzenie kosztów** — dokładnie sprawdzisz, ile OpenClaw wydaje na wszystkie modele
- **Routing modeli** — przełączanie między Claude, GPT-4, Gemini i Bedrock bez zmian konfiguracji
- **Klucze wirtualne** — twórz klucze z limitami wydatków dla OpenClaw
- **Logowanie** — pełne logi żądań/odpowiedzi do debugowania
- **Przełączanie awaryjne** — automatyczny failover, jeśli główny dostawca jest niedostępny

## Szybki start

### Przez onboarding

```bash
openclaw onboard --auth-choice litellm-api-key
```

### Konfiguracja ręczna

1. Uruchom LiteLLM Proxy:

```bash
pip install 'litellm[proxy]'
litellm --model claude-opus-4-6
```

2. Skieruj OpenClaw do LiteLLM:

```bash
export LITELLM_API_KEY="your-litellm-key"

openclaw
```

To wszystko. OpenClaw teraz kieruje ruch przez LiteLLM.

## Konfiguracja

### Zmienne środowiskowe

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Plik konfiguracyjny

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## Klucze wirtualne

Utwórz dedykowany klucz dla OpenClaw z limitami wydatków:

```bash
curl -X POST "http://localhost:4000/key/generate" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "openclaw",
    "max_budget": 50.00,
    "budget_duration": "monthly"
  }'
```

Użyj wygenerowanego klucza jako `LITELLM_API_KEY`.

## Routing modeli

LiteLLM może kierować żądania modeli do różnych backendów. Skonfiguruj to w `config.yaml` LiteLLM:

```yaml
model_list:
  - model_name: claude-opus-4-6
    litellm_params:
      model: claude-opus-4-6
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: gpt-4o
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY
```

OpenClaw nadal wysyła żądania do `claude-opus-4-6` — routing obsługuje LiteLLM.

## Wyświetlanie użycia

Sprawdź panel LiteLLM lub API:

```bash
# Informacje o kluczu
curl "http://localhost:4000/key/info" \
  -H "Authorization: Bearer sk-litellm-key"

# Logi wydatków
curl "http://localhost:4000/spend/logs" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

## Uwagi

- LiteLLM domyślnie działa pod adresem `http://localhost:4000`
- OpenClaw łączy się przez endpoint `/v1` zgodny z OpenAI w stylu proxy LiteLLM
- Natywne formatowanie żądań wyłącznie dla OpenAI nie ma zastosowania przez LiteLLM:
  brak `service_tier`, brak `store` dla Responses, brak wskazówek pamięci podręcznej promptów i brak
  formatowania payloadów zgodności reasoning OpenAI
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`)
  nie są wstrzykiwane dla niestandardowych adresów base URL LiteLLM

## Zobacz także

- [Dokumentacja LiteLLM](https://docs.litellm.ai)
- [Dostawcy modeli](/pl/concepts/model-providers)
