---
read_when:
    - Chcesz mieć krok LLM zwracający tylko JSON wewnątrz przepływów pracy
    - Potrzebujesz wyjścia LLM zwalidowanego schematem do automatyzacji
summary: Zadania LLM zwracające tylko JSON dla przepływów pracy (opcjonalne narzędzie pluginu)
title: LLM Task
x-i18n:
    generated_at: "2026-04-05T14:08:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: cbe9b286a8e958494de06a59b6e7b750a82d492158df344c7afe30fce24f0584
    source_path: tools/llm-task.md
    workflow: 15
---

# LLM Task

`llm-task` to **opcjonalne narzędzie pluginu**, które uruchamia zadanie LLM zwracające tylko JSON i
zwraca ustrukturyzowane wyjście (opcjonalnie walidowane względem JSON Schema).

To idealne rozwiązanie dla silników przepływów pracy, takich jak Lobster: możesz dodać pojedynczy krok LLM
bez pisania niestandardowego kodu OpenClaw dla każdego przepływu pracy.

## Włącz plugin

1. Włącz plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Dodaj narzędzie do listy dozwolonych (jest rejestrowane z `optional: true`):

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

## Konfiguracja (opcjonalna)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.4",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai-codex/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` to lista dozwolonych ciągów `provider/model`. Jeśli jest ustawiona, każde żądanie
spoza tej listy zostanie odrzucone.

## Parametry narzędzia

- `prompt` (string, wymagane)
- `input` (any, opcjonalne)
- `schema` (object, opcjonalny JSON Schema)
- `provider` (string, opcjonalne)
- `model` (string, opcjonalne)
- `thinking` (string, opcjonalne)
- `authProfileId` (string, opcjonalne)
- `temperature` (number, opcjonalne)
- `maxTokens` (number, opcjonalne)
- `timeoutMs` (number, opcjonalne)

`thinking` akceptuje standardowe presety reasoning OpenClaw, takie jak `low` lub `medium`.

## Wyjście

Zwraca `details.json` zawierający sparsowany JSON (i waliduje względem
`schema`, jeśli została podana).

## Przykład: krok przepływu pracy Lobster

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## Uwagi dotyczące bezpieczeństwa

- Narzędzie działa **tylko z JSON** i instruuje model, aby zwracał wyłącznie JSON (bez
  bloków kodu, bez komentarzy).
- W tym uruchomieniu żadne narzędzia nie są udostępniane modelowi.
- Traktuj wyjście jako niezaufane, chyba że walidujesz je za pomocą `schema`.
- Umieszczaj zatwierdzenia przed każdym krokiem powodującym skutki uboczne (send, post, exec).
