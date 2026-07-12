---
read_when:
    - Chcesz użyć w przepływach pracy kroku LLM zwracającego wyłącznie JSON
    - Potrzebujesz danych wyjściowych LLM zweryfikowanych względem schematu na potrzeby automatyzacji
summary: Zadania LLM zwracające wyłącznie JSON na potrzeby przepływów pracy (opcjonalne narzędzie pluginu)
title: Zadanie LLM
x-i18n:
    generated_at: "2026-07-12T15:42:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78ea533f43546fbdd66c7f7138b8dea0b12b02d38925689324b390a12d0c4c5a
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` to dołączone **opcjonalne narzędzie Pluginu**, które wykonuje pojedyncze wywołanie LLM zwracające wyłącznie JSON i zwraca dane strukturalne, opcjonalnie zweryfikowane względem schematu JSON. Zapewnia silnikom przepływów pracy, takim jak Lobster, krok LLM bez konieczności tworzenia niestandardowego kodu OpenClaw dla każdego przepływu pracy.

## Włączanie

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

2. Zezwól na użycie narzędzia:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

`alsoAllow` dodaje `llm-task` do aktywnego profilu narzędzi bez ograniczania innych podstawowych narzędzi. Zamiast tego użyj `tools.allow` tylko wtedy, gdy chcesz zastosować restrykcyjny tryb listy dozwolonych narzędzi.

## Konfiguracja (opcjonalna)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.6-sol",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.6-sol"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` to lista dozwolonych ciągów znaków `provider/model`; żądanie użycia dowolnego innego modelu jest odrzucane. Wszystkie pozostałe klucze są wartościami zastępczymi dla poszczególnych wywołań, używanymi, gdy wywołanie narzędzia pomija dany parametr.

## Parametry narzędzia

| Parametr        | Typ    | Uwagi                                                                                                                                                              |
| --------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `prompt`        | string | Wymagany. Instrukcja zadania dla LLM.                                                                                                                              |
| `input`         | any    | Opcjonalne dane wejściowe; serializowane do formatu JSON i dołączane do promptu.                                                                                   |
| `schema`        | object | Opcjonalny schemat JSON, względem którego muszą zostać zweryfikowane przeanalizowane dane wyjściowe.                                                               |
| `provider`      | string | Zastępuje `defaultProvider` / domyślnego dostawcę agenta.                                                                                                          |
| `model`         | string | Zastępuje `defaultModel`; przyjmuje identyfikatory modeli bez prefiksu, aliasy lub odwołanie `provider/model` (powielony prefiks dostawcy jest usuwany automatycznie). |
| `thinking`      | string | Poziom rozumowania (np. `low`, `medium`); musi być obsługiwany przez wybrany model.                                                                                  |
| `authProfileId` | string | Zastępuje `defaultAuthProfileId`.                                                                                                                                  |
| `temperature`   | number | Stosowany w miarę możliwości; nie wszyscy dostawcy go obsługują.                                                                                                   |
| `maxTokens`     | number | Stosowany w miarę możliwości limit tokenów wyjściowych.                                                                                                            |
| `timeoutMs`     | number | Limit czasu wykonania; domyślnie `30000`.                                                                                                                          |

## Dane wyjściowe

Zwraca `details.json` (przeanalizowany i zweryfikowany względem schematu JSON) oraz `details.provider` i `details.model`, które wskazują faktycznie użytego dostawcę i model.

## Przykład: krok przepływu pracy Lobster

### Ważne ograniczenie

Poniższy przykład zakłada, że **samodzielny Lobster CLI** działa w środowisku, w którym `openclaw.invoke` ma już prawidłowy adres URL Gateway i kontekst uwierzytelniania.

W przypadku dołączonego **osadzonego** mechanizmu uruchamiającego Lobster wewnątrz OpenClaw ten wzorzec zagnieżdżonego CLI **nie jest obecnie niezawodny**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Dopóki osadzony Lobster nie będzie mieć obsługiwanego mechanizmu integracji dla tego przepływu, preferuj:

- bezpośrednie wywołania narzędzia `llm-task` poza Lobster lub
- kroki Lobster, które nie opierają się na zagnieżdżonych wywołaniach `openclaw.invoke`.

Przykład dla samodzielnego Lobster CLI:

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

- **Tylko JSON**: model otrzymuje instrukcję, aby zwrócić wyłącznie wartość JSON, bez bloków kodu ani komentarzy.
- **Bez narzędzi**: w podstawowym przebiegu narzędzia są wyłączone, więc model nie może wykonywać wywołań w trakcie zadania.
- Traktuj dane wyjściowe jako niezaufane, chyba że zweryfikujesz je za pomocą `schema`.
- Umieść zatwierdzenia przed każdym krokiem wywołującym skutki uboczne (wysyłanie, publikowanie, wykonywanie), który korzysta z tych danych wyjściowych.

## Powiązane materiały

- [Poziomy rozumowania](/pl/tools/thinking)
- [Podagenci](/pl/tools/subagents)
- [Polecenia z ukośnikiem](/pl/tools/slash-commands)
