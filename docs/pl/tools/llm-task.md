---
read_when:
    - Chcesz użyć kroku LLM zwracającego wyłącznie JSON w przepływach pracy
    - Potrzebujesz wyniku LLM zweryfikowanego względem schematu do automatyzacji
summary: Zadania LLM wyłącznie w formacie JSON dla przepływów pracy (opcjonalne narzędzie Plugin)
title: Zadanie LLM
x-i18n:
    generated_at: "2026-05-04T02:26:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cdc5d4feef17fb6d6d90d819d4c92d26a4ec43e4f5364c6acbaad1934a89269
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` to **opcjonalne narzędzie Plugin**, które uruchamia zadanie LLM zwracające wyłącznie JSON i zwraca ustrukturyzowane dane wyjściowe (opcjonalnie zweryfikowane względem JSON Schema).

Jest to idealne rozwiązanie dla silników przepływów pracy, takich jak Lobster: możesz dodać pojedynczy krok LLM bez pisania niestandardowego kodu OpenClaw dla każdego przepływu pracy.

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

2. Zezwól na opcjonalne narzędzie:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

Używaj `tools.allow` tylko wtedy, gdy chcesz zastosować restrykcyjny tryb listy dozwolonych.

## Konfiguracja (opcjonalna)

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

`allowedModels` to lista dozwolonych ciągów `provider/model`. Jeśli jest ustawiona, każde żądanie spoza listy zostanie odrzucone.

## Parametry narzędzia

- `prompt` (ciąg znaków, wymagany)
- `input` (dowolny, opcjonalny)
- `schema` (obiekt, opcjonalny JSON Schema)
- `provider` (ciąg znaków, opcjonalny)
- `model` (ciąg znaków, opcjonalny)
- `thinking` (ciąg znaków, opcjonalny)
- `authProfileId` (ciąg znaków, opcjonalny)
- `temperature` (liczba, opcjonalna)
- `maxTokens` (liczba, opcjonalna)
- `timeoutMs` (liczba, opcjonalna)

`thinking` akceptuje standardowe presety rozumowania OpenClaw, takie jak `low` lub `medium`.

## Dane wyjściowe

Zwraca `details.json` zawierający sparsowany JSON (oraz weryfikuje względem `schema`, gdy ją podano).

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

- Narzędzie działa **wyłącznie w JSON** i instruuje model, aby zwracał wyłącznie JSON (bez bloków kodu, bez komentarza).
- W tym uruchomieniu modelowi nie są udostępniane żadne narzędzia.
- Traktuj dane wyjściowe jako niezaufane, chyba że zweryfikujesz je za pomocą `schema`.
- Umieszczaj zatwierdzenia przed każdym krokiem powodującym skutki uboczne (wysyłanie, publikowanie, exec).

## Powiązane

- [Poziomy rozumowania](/pl/tools/thinking)
- [Subagenci](/pl/tools/subagents)
- [Polecenia ukośnikowe](/pl/tools/slash-commands)
