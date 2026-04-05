---
read_when:
    - Chcesz używać Perplexity Search do wyszukiwania w sieci
    - Potrzebujesz konfiguracji `PERPLEXITY_API_KEY` lub `OPENROUTER_API_KEY`
summary: Perplexity Search API oraz zgodność Sonar/OpenRouter dla `web_search`
title: Perplexity Search (starsza ścieżka)
x-i18n:
    generated_at: "2026-04-05T13:59:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba91e63e7412f3b6f889ee11f4a66563014932a1dc7be8593fe2262a4877b89b
    source_path: perplexity.md
    workflow: 15
---

# Perplexity Search API

OpenClaw obsługuje Perplexity Search API jako dostawcę `web_search`.
Zwraca ustrukturyzowane wyniki z polami `title`, `url` i `snippet`.

Dla zgodności OpenClaw obsługuje także starsze konfiguracje Perplexity Sonar/OpenRouter.
Jeśli używasz `OPENROUTER_API_KEY`, klucza `sk-or-...` w `plugins.entries.perplexity.config.webSearch.apiKey` lub ustawisz `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, dostawca przełącza się na ścieżkę chat completions i zwraca odpowiedzi syntetyzowane przez AI z cytowaniami zamiast ustrukturyzowanych wyników Search API.

## Jak uzyskać klucz API Perplexity

1. Utwórz konto Perplexity na [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Wygeneruj klucz API w panelu
3. Zapisz klucz w konfiguracji lub ustaw `PERPLEXITY_API_KEY` w środowisku Gateway.

## Zgodność z OpenRouter

Jeśli używałeś już OpenRouter dla Perplexity Sonar, zachowaj `provider: "perplexity"` i ustaw `OPENROUTER_API_KEY` w środowisku Gateway albo zapisz klucz `sk-or-...` w `plugins.entries.perplexity.config.webSearch.apiKey`.

Opcjonalne ustawienia zgodności:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Przykłady konfiguracji

### Natywne Perplexity Search API

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### Zgodność z OpenRouter / Sonar

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## Gdzie ustawić klucz

**Przez konfigurację:** uruchom `openclaw configure --section web`. Zapisuje to klucz w
`~/.openclaw/openclaw.json` pod `plugins.entries.perplexity.config.webSearch.apiKey`.
To pole akceptuje także obiekty SecretRef.

**Przez środowisko:** ustaw `PERPLEXITY_API_KEY` lub `OPENROUTER_API_KEY`
w środowisku procesu Gateway. Dla instalacji gateway umieść go w
`~/.openclaw/.env` (lub w środowisku usługi). Zobacz [Zmienne env](/help/faq#env-vars-and-env-loading).

Jeśli skonfigurowano `provider: "perplexity"` i SecretRef klucza Perplexity nie zostanie rozwiązany bez zapasowej wartości z env, uruchamianie/przeładowanie zakończy się natychmiast błędem.

## Parametry narzędzia

Te parametry mają zastosowanie do natywnej ścieżki Perplexity Search API.

| Parametr              | Opis                                                 |
| --------------------- | ---------------------------------------------------- |
| `query`               | Zapytanie wyszukiwania (wymagane)                    |
| `count`               | Liczba wyników do zwrócenia (1-10, domyślnie: 5)     |
| `country`             | 2-literowy kod kraju ISO (np. `"US"`, `"DE"`)        |
| `language`            | Kod języka ISO 639-1 (np. `"en"`, `"de"`, `"fr"`)    |
| `freshness`           | Filtr czasu: `day` (24h), `week`, `month` lub `year` |
| `date_after`          | Tylko wyniki opublikowane po tej dacie (YYYY-MM-DD)  |
| `date_before`         | Tylko wyniki opublikowane przed tą datą (YYYY-MM-DD) |
| `domain_filter`       | Tablica allowlisty/denylisty domen (maks. 20)        |
| `max_tokens`          | Całkowity budżet treści (domyślnie: 25000, maks.: 1000000) |
| `max_tokens_per_page` | Limit tokenów na stronę (domyślnie: 2048)            |

Dla starszej ścieżki zgodności Sonar/OpenRouter:

- akceptowane są `query`, `count` i `freshness`
- `count` służy tam wyłącznie zgodności; odpowiedź nadal jest jedną syntetyzowaną
  odpowiedzią z cytowaniami, a nie listą N wyników
- filtry dostępne tylko w Search API, takie jak `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` i `max_tokens_per_page`,
  zwracają jawne błędy

**Przykłady:**

```javascript
// Wyszukiwanie specyficzne dla kraju i języka
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Ostatnie wyniki (ostatni tydzień)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Wyszukiwanie w zakresie dat
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Filtrowanie domen (allowlista)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Filtrowanie domen (denylista - prefiks `-`)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Bardziej rozbudowane wyodrębnianie treści
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Reguły filtrowania domen

- Maksymalnie 20 domen na filtr
- Nie można łączyć allowlisty i denylisty w jednym żądaniu
- Użyj prefiksu `-` dla wpisów denylisty (np. `["-reddit.com"]`)

## Uwagi

- Perplexity Search API zwraca ustrukturyzowane wyniki wyszukiwania w sieci (`title`, `url`, `snippet`)
- OpenRouter albo jawne `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` przełącza Perplexity z powrotem na Sonar chat completions dla zgodności
- Zgodność Sonar/OpenRouter zwraca jedną syntetyzowaną odpowiedź z cytowaniami, a nie ustrukturyzowane wiersze wyników
- Wyniki są domyślnie cache'owane przez 15 minut (konfigurowalne przez `cacheTtlMinutes`)

Zobacz [Narzędzia webowe](/tools/web), aby poznać pełną konfigurację `web_search`.
Więcej szczegółów znajdziesz w [dokumentacji Perplexity Search API](https://docs.perplexity.ai/docs/search/quickstart).
