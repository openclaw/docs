---
read_when:
    - Chcesz uruchomić OpenClaw z lokalnym serwerem vLLM
    - Chcesz używać punktów końcowych /v1 zgodnych z OpenAI z własnymi modelami
summary: Uruchamiaj OpenClaw z vLLM (lokalny serwer zgodny z OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-05T14:04:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebde34d0453586d10340680b8d51465fdc98bd28e8a96acfaeb24606886b50f4
    source_path: providers/vllm.md
    workflow: 15
---

# vLLM

vLLM może udostępniać modele open source (oraz niektóre modele niestandardowe) przez **interfejs HTTP zgodny z OpenAI**. OpenClaw może łączyć się z vLLM przy użyciu API `openai-completions`.

OpenClaw może także **automatycznie wykrywać** dostępne modele z vLLM, jeśli włączysz to przez `VLLM_API_KEY` (dowolna wartość działa, jeśli serwer nie wymusza uwierzytelniania) i nie zdefiniujesz jawnego wpisu `models.providers.vllm`.

## Szybki start

1. Uruchom vLLM z serwerem zgodnym z OpenAI.

Twój bazowy URL powinien udostępniać punkty końcowe `/v1` (na przykład `/v1/models`, `/v1/chat/completions`). vLLM zwykle działa pod adresem:

- `http://127.0.0.1:8000/v1`

2. Włącz to jawnie (dowolna wartość działa, jeśli uwierzytelnianie nie jest skonfigurowane):

```bash
export VLLM_API_KEY="vllm-local"
```

3. Wybierz model (zastąp jednym z identyfikatorów modeli vLLM):

```json5
{
  agents: {
    defaults: {
      model: { primary: "vllm/your-model-id" },
    },
  },
}
```

## Wykrywanie modeli (niejawny dostawca)

Gdy `VLLM_API_KEY` jest ustawione (lub istnieje profil uwierzytelniania) i **nie** definiujesz `models.providers.vllm`, OpenClaw wykona zapytanie:

- `GET http://127.0.0.1:8000/v1/models`

…i przekształci zwrócone identyfikatory w wpisy modeli.

Jeśli jawnie ustawisz `models.providers.vllm`, automatyczne wykrywanie zostanie pominięte i musisz ręcznie zdefiniować modele.

## Jawna konfiguracja (modele ręczne)

Użyj jawnej konfiguracji, gdy:

- vLLM działa na innym hoście/porcie.
- Chcesz przypiąć wartości `contextWindow`/`maxTokens`.
- Twój serwer wymaga prawdziwego klucza API (albo chcesz kontrolować nagłówki).

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Rozwiązywanie problemów

- Sprawdź, czy serwer jest osiągalny:

```bash
curl http://127.0.0.1:8000/v1/models
```

- Jeśli żądania kończą się błędami uwierzytelniania, ustaw prawdziwe `VLLM_API_KEY`, zgodne z konfiguracją serwera, albo skonfiguruj dostawcę jawnie pod `models.providers.vllm`.

## Zachowanie w stylu proxy

vLLM jest traktowane jako backend `/v1` zgodny z OpenAI w stylu proxy, a nie jako natywny
punkt końcowy OpenAI.

- natywne formatowanie żądań przeznaczone wyłącznie dla OpenAI nie ma tutaj zastosowania
- brak `service_tier`, brak Responses `store`, brak wskazówek pamięci podręcznej promptów i brak
  formatowania ładunku zgodności rozumowania OpenAI
- ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`)
  nie są wstrzykiwane dla niestandardowych bazowych URL-i vLLM
