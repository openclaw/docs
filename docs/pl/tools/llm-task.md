---
read_when:
    - Chcesz mieć krok LLM zwracający wyłącznie JSON wewnątrz workflowów
    - Potrzebujesz danych wyjściowych LLM zweryfikowanych względem schematu do automatyzacji
summary: Zadania LLM wyłącznie w formacie JSON dla przepływów pracy (opcjonalne narzędzie Plugin)
title: Zadanie LLM
x-i18n:
    generated_at: "2026-06-27T18:28:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab83202bd0954a948c933c80de17385eb385573b8e3974dba41ff876f91c3ddb
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` to **opcjonalne narzędzie Plugin**, które uruchamia zadanie LLM wyłącznie w JSON i
zwraca dane strukturalne (opcjonalnie walidowane względem JSON Schema).

To idealne rozwiązanie dla silników przepływów pracy takich jak Lobster: możesz dodać pojedynczy krok LLM
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

2. Zezwól na opcjonalne narzędzie:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

Używaj `tools.allow` tylko wtedy, gdy chcesz restrykcyjnego trybu listy dozwolonych.

## Konfiguracja (opcjonalna)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.5"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` to lista dozwolonych ciągów `provider/model`. Jeśli jest ustawiona, każde żądanie
spoza listy jest odrzucane.

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

Zwraca `details.json` zawierający sparsowany JSON (i waliduje go względem
`schema`, gdy jest podany).

## Przykład: krok przepływu pracy Lobster

### Ważne ograniczenie

Poniższy przykład zakłada, że **samodzielny Lobster CLI** działa w środowisku, w którym `openclaw.invoke` ma już poprawny adres URL Gateway i kontekst uwierzytelniania.

Dla dołączonego **osadzonego** runnera Lobster wewnątrz OpenClaw ten zagnieżdżony wzorzec CLI **nie jest obecnie niezawodny**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Dopóki osadzony Lobster nie będzie miał obsługiwanego mostu dla tego przepływu, preferuj:

- bezpośrednie wywołania narzędzia `llm-task` poza Lobster, albo
- kroki Lobster, które nie polegają na zagnieżdżonych wywołaniach `openclaw.invoke`.

Przykład samodzielnego Lobster CLI:

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

- Narzędzie działa **wyłącznie w JSON** i instruuje model, aby generował tylko JSON (bez
  bloków kodu, bez komentarza).
- W tym uruchomieniu model nie ma udostępnionych żadnych narzędzi.
- Traktuj dane wyjściowe jako niezaufane, chyba że walidujesz je za pomocą `schema`.
- Umieszczaj zatwierdzenia przed każdym krokiem wywołującym skutki uboczne (wysłanie, publikacja, wykonanie).

## Powiązane

- [Poziomy rozumowania](/pl/tools/thinking)
- [Podagenci](/pl/tools/subagents)
- [Polecenia ukośnikowe](/pl/tools/slash-commands)
