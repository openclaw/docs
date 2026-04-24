---
read_when:
    - Chcesz używać Exa dla `web_search`
    - Potrzebujesz `EXA_API_KEY`
    - Chcesz używać wyszukiwania neuronowego lub ekstrakcji treści
summary: Exa AI search — wyszukiwanie neuronowe i słów kluczowych z ekstrakcją treści
title: Wyszukiwanie Exa
x-i18n:
    generated_at: "2026-04-24T09:35:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73cb69e672f432659c94c8d93ef52a88ecfcc9fa17d89af3e54493bd0cca4207
    source_path: tools/exa-search.md
    workflow: 15
---

OpenClaw obsługuje [Exa AI](https://exa.ai/) jako providera `web_search`. Exa
oferuje tryby wyszukiwania neuronowego, słów kluczowych i hybrydowego z wbudowaną
ekstrakcją treści (wyróżnienia, tekst, podsumowania).

## Uzyskaj klucz API

<Steps>
  <Step title="Utwórz konto">
    Zarejestruj się na [exa.ai](https://exa.ai/) i wygeneruj klucz API w swoim
    panelu.
  </Step>
  <Step title="Zapisz klucz">
    Ustaw `EXA_API_KEY` w środowisku gateway albo skonfiguruj przez:

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

**Alternatywa środowiskowa:** ustaw `EXA_API_KEY` w środowisku gateway.
W przypadku instalacji gateway umieść go w `~/.openclaw/.env`.

## Parametry narzędzia

<ParamField path="query" type="string" required>
Zapytanie wyszukiwania.
</ParamField>

<ParamField path="count" type="number">
Liczba wyników do zwrócenia (1–100).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
Tryb wyszukiwania.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtr czasu.
</ParamField>

<ParamField path="date_after" type="string">
Wyniki po tej dacie (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Wyniki przed tą datą (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
Opcje ekstrakcji treści (patrz niżej).
</ParamField>

### Ekstrakcja treści

Exa może zwracać wyodrębnioną treść razem z wynikami wyszukiwania. Przekaż obiekt `contents`,
aby to włączyć:

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

| Opcja `contents` | Typ                                                                   | Opis                     |
| ---------------- | --------------------------------------------------------------------- | ------------------------ |
| `text`           | `boolean \| { maxCharacters }`                                        | Wyodrębnij pełny tekst strony |
| `highlights`     | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Wyodrębnij kluczowe zdania |
| `summary`        | `boolean \| { query }`                                                | Podsumowanie wygenerowane przez AI |

### Tryby wyszukiwania

| Tryb             | Opis                              |
| ---------------- | --------------------------------- |
| `auto`           | Exa wybiera najlepszy tryb (domyślnie) |
| `neural`         | Wyszukiwanie semantyczne/oparte na znaczeniu |
| `fast`           | Szybkie wyszukiwanie słów kluczowych |
| `deep`           | Dokładne głębokie wyszukiwanie    |
| `deep-reasoning` | Głębokie wyszukiwanie z rozumowaniem |
| `instant`        | Najszybsze wyniki                 |

## Uwagi

- Jeśli nie podano opcji `contents`, Exa domyślnie używa `{ highlights: true }`,
  aby wyniki zawierały fragmenty z kluczowymi zdaniami
- Wyniki zachowują pola `highlightScores` i `summary` z odpowiedzi API Exa,
  gdy są dostępne
- Opisy wyników są ustalane najpierw na podstawie `highlights`, potem `summary`, a następnie
  pełnego tekstu — w zależności od tego, co jest dostępne
- `freshness` oraz `date_after`/`date_before` nie mogą być łączone — użyj jednego
  trybu filtrowania czasu
- Na jedno zapytanie można zwrócić do 100 wyników (z zastrzeżeniem limitów
  typu wyszukiwania Exa)
- Wyniki są domyślnie buforowane przez 15 minut (konfigurowalne przez
  `cacheTtlMinutes`)
- Exa to oficjalna integracja API ze strukturalnymi odpowiedziami JSON

## Powiązane

- [Przegląd wyszukiwania w sieci](/pl/tools/web) -- wszyscy providerzy i automatyczne wykrywanie
- [Brave Search](/pl/tools/brave-search) -- wyniki strukturalne z filtrami kraju/języka
- [Perplexity Search](/pl/tools/perplexity-search) -- wyniki strukturalne z filtrowaniem domen
