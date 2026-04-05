---
read_when:
    - Chcesz używać Exa dla web_search
    - Potrzebujesz `EXA_API_KEY`
    - Chcesz używać wyszukiwania neuronowego lub ekstrakcji treści
summary: Wyszukiwanie Exa AI — wyszukiwanie neuronowe i słowami kluczowymi z ekstrakcją treści
title: Exa Search
x-i18n:
    generated_at: "2026-04-05T14:07:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 307b727b4fb88756cac51c17ffd73468ca695c4481692e03d0b4a9969982a2a8
    source_path: tools/exa-search.md
    workflow: 15
---

# Exa Search

OpenClaw obsługuje [Exa AI](https://exa.ai/) jako providera `web_search`. Exa
oferuje tryby wyszukiwania neuronowego, słowami kluczowymi i hybrydowego z wbudowaną
ekstrakcją treści (wyróżnienia, tekst, podsumowania).

## Pobierz klucz API

<Steps>
  <Step title="Utwórz konto">
    Zarejestruj się na [exa.ai](https://exa.ai/) i wygeneruj klucz API w swoim
    panelu.
  </Step>
  <Step title="Zapisz klucz">
    Ustaw `EXA_API_KEY` w środowisku Gateway albo skonfiguruj przez:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Konfiguracja

```json5
{
  plugins: {
    entries: {
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // opcjonalne, jeśli ustawiono EXA_API_KEY
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**Alternatywa środowiskowa:** ustaw `EXA_API_KEY` w środowisku Gateway.
W przypadku instalacji gateway umieść ją w `~/.openclaw/.env`.

## Parametry narzędzia

| Parametr     | Opis                                                                          |
| ------------- | ----------------------------------------------------------------------------- |
| `query`       | Zapytanie wyszukiwania (wymagane)                                              |
| `count`       | Liczba wyników do zwrócenia (1-100)                                            |
| `type`        | Tryb wyszukiwania: `auto`, `neural`, `fast`, `deep`, `deep-reasoning` lub `instant` |
| `freshness`   | Filtr czasu: `day`, `week`, `month` lub `year`                                 |
| `date_after`  | Wyniki po tej dacie (YYYY-MM-DD)                                               |
| `date_before` | Wyniki przed tą datą (YYYY-MM-DD)                                              |
| `contents`    | Opcje ekstrakcji treści (zobacz poniżej)                                       |

### Ekstrakcja treści

Exa może zwracać wyodrębnioną treść obok wyników wyszukiwania. Przekaż obiekt `contents`,
aby ją włączyć:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // pełny tekst strony
    highlights: { numSentences: 3 }, // kluczowe zdania
    summary: true, // podsumowanie AI
  },
});
```

| Opcja `contents` | Typ                                                                   | Opis                   |
| --------------- | --------------------------------------------------------------------- | ---------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | Wyodrębnij pełny tekst strony |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Wyodrębnij kluczowe zdania |
| `summary`       | `boolean \| { query }`                                                | Podsumowanie generowane przez AI |

### Tryby wyszukiwania

| Tryb             | Opis                              |
| ---------------- | --------------------------------- |
| `auto`           | Exa wybiera najlepszy tryb (domyślnie) |
| `neural`         | Wyszukiwanie semantyczne/oparte na znaczeniu |
| `fast`           | Szybkie wyszukiwanie słowami kluczowymi |
| `deep`           | Dokładne głębokie wyszukiwanie    |
| `deep-reasoning` | Głębokie wyszukiwanie z rozumowaniem |
| `instant`        | Najszybsze wyniki                 |

## Uwagi

- Jeśli nie podano opcji `contents`, Exa domyślnie używa `{ highlights: true }`,
  więc wyniki zawierają fragmenty kluczowych zdań
- Wyniki zachowują pola `highlightScores` i `summary` z odpowiedzi API Exa,
  gdy są dostępne
- Opisy wyników są rozwiązywane najpierw z `highlights`, potem z `summary`, a następnie z
  pełnego tekstu — zależnie od tego, co jest dostępne
- `freshness` oraz `date_after`/`date_before` nie mogą być używane łącznie — użyj jednego
  trybu filtrowania czasu
- Na jedno zapytanie można zwrócić do 100 wyników (z zastrzeżeniem limitów
  typu wyszukiwania Exa)
- Wyniki są domyślnie buforowane przez 15 minut (można to skonfigurować przez
  `cacheTtlMinutes`)
- Exa to oficjalna integracja API ze strukturalnymi odpowiedziami JSON

## Powiązane

- [Przegląd Web Search](/tools/web) -- wszyscy providerzy i automatyczne wykrywanie
- [Brave Search](/tools/brave-search) -- wyniki strukturalne z filtrami kraju/języka
- [Perplexity Search](/tools/perplexity-search) -- wyniki strukturalne z filtrowaniem domen
