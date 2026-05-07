---
read_when:
    - Chcesz kroku LLM zwracającego wyłącznie JSON w ramach przepływów pracy
    - Potrzebujesz danych wyjściowych LLM zweryfikowanych względem schematu do automatyzacji
summary: Zadania LLM wyłącznie w formacie JSON dla przepływów pracy (opcjonalne narzędzie Plugin)
title: Zadanie LLM
x-i18n:
    generated_at: "2026-05-07T13:26:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4f5efe399165e31a7f5966b93c2f83bced4fd96b7f04f5156412fd321bf5f403
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` to **opcjonalne narzędzie pluginu**, które uruchamia zadanie LLM zwracające wyłącznie JSON i
zwraca ustrukturyzowane dane wyjściowe (opcjonalnie walidowane względem JSON Schema).

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

`allowedModels` to lista dozwolonych ciągów `provider/model`. Jeśli jest ustawiona, każde żądanie
spoza listy zostanie odrzucone.

## Parametry narzędzia

- `prompt` (ciąg, wymagany)
- `input` (dowolny, opcjonalny)
- `schema` (obiekt, opcjonalny JSON Schema)
- `provider` (ciąg, opcjonalny)
- `model` (ciąg, opcjonalny)
- `thinking` (ciąg, opcjonalny)
- `authProfileId` (ciąg, opcjonalny)
- `temperature` (liczba, opcjonalna)
- `maxTokens` (liczba, opcjonalna)
- `timeoutMs` (liczba, opcjonalna)

`thinking` akceptuje standardowe presety rozumowania OpenClaw, takie jak `low` lub `medium`.

## Dane wyjściowe

Zwraca `details.json` zawierający przeanalizowany JSON (i waliduje względem
`schema`, jeśli ją podano).

## Przykład: krok przepływu pracy Lobster

### Ważne ograniczenie

Poniższy przykład zakłada, że **samodzielny Lobster CLI** działa w środowisku, w którym `openclaw.invoke` ma już poprawny adres URL Gateway/kontekst uwierzytelniania.

Dla dołączonego **osadzonego** runnera Lobster wewnątrz OpenClaw ten wzorzec zagnieżdżonego CLI **nie jest obecnie niezawodny**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Dopóki osadzony Lobster nie będzie mieć obsługiwanego mostu dla tego przepływu, preferuj jedno z poniższych rozwiązań:

- bezpośrednie wywołania narzędzia `llm-task` poza Lobster albo
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

- Narzędzie zwraca **wyłącznie JSON** i instruuje model, aby zwracał tylko JSON (bez
  bloków kodu, bez komentarzy).
- W tym uruchomieniu żadne narzędzia nie są udostępniane modelowi.
- Traktuj dane wyjściowe jako niezaufane, chyba że walidujesz je za pomocą `schema`.
- Umieść zatwierdzenia przed każdym krokiem wywołującym skutki uboczne (wysyłanie, publikowanie, wykonywanie).

## Powiązane

- [Poziomy rozumowania](/pl/tools/thinking)
- [Subagenci](/pl/tools/subagents)
- [Polecenia z ukośnikiem](/pl/tools/slash-commands)
