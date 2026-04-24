---
read_when:
    - Chcesz kroku LLM zwracającego tylko JSON wewnątrz przepływów pracy
    - Potrzebujesz walidowanego przez schemat wyjścia LLM do automatyzacji
summary: Zadania LLM zwracające tylko JSON dla przepływów pracy (opcjonalne narzędzie Pluginu)
title: Zadanie LLM
x-i18n:
    generated_at: "2026-04-24T09:37:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613aefd1bac5b9675821a118c11130c8bfaefb1673d0266f14ff4e91b47fed8b
    source_path: tools/llm-task.md
    workflow: 15
---

`llm-task` to **opcjonalne narzędzie Pluginu**, które uruchamia zadanie LLM zwracające tylko JSON i
zwraca uporządkowane dane wyjściowe (opcjonalnie walidowane względem JSON Schema).

To rozwiązanie idealnie nadaje się do silników przepływów pracy, takich jak Lobster: możesz dodać pojedynczy krok LLM
bez pisania niestandardowego kodu OpenClaw dla każdego przepływu pracy.

## Włącz Plugin

1. Włącz Plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. Dodaj narzędzie do allowlisty (jest rejestrowane z `optional: true`):

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

## Konfiguracja (opcjonalnie)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` to allowlista ciągów `provider/model`. Jeśli jest ustawiona, każde żądanie
spoza listy zostanie odrzucone.

## Parametry narzędzia

- `prompt` (string, wymagane)
- `input` (dowolny typ, opcjonalne)
- `schema` (object, opcjonalny JSON Schema)
- `provider` (string, opcjonalne)
- `model` (string, opcjonalne)
- `thinking` (string, opcjonalne)
- `authProfileId` (string, opcjonalne)
- `temperature` (number, opcjonalne)
- `maxTokens` (number, opcjonalne)
- `timeoutMs` (number, opcjonalne)

`thinking` akceptuje standardowe presety rozumowania OpenClaw, takie jak `low` lub `medium`.

## Dane wyjściowe

Zwraca `details.json` zawierający sparsowany JSON (i waliduje go względem
`schema`, jeśli zostanie podany).

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

- Narzędzie jest **tylko-JSON** i instruuje model, aby zwracał wyłącznie JSON (bez
  bloków kodu, bez komentarzy).
- W tym przebiegu żadne narzędzia nie są udostępniane modelowi.
- Traktuj dane wyjściowe jako niezaufane, chyba że zwalidujesz je za pomocą `schema`.
- Umieszczaj zatwierdzenia przed każdym krokiem wywołującym skutki uboczne (wysyłanie, publikowanie, exec).

## Powiązane

- [Poziomy thinking](/pl/tools/thinking)
- [Podagenci](/pl/tools/subagents)
- [Polecenia Slash](/pl/tools/slash-commands)
