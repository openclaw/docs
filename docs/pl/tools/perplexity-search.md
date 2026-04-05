---
read_when:
    - Chcesz używać Perplexity Search do wyszukiwania w Web
    - Potrzebujesz konfiguracji `PERPLEXITY_API_KEY` lub `OPENROUTER_API_KEY`
summary: Perplexity Search API i zgodność Sonar/OpenRouter dla `web_search`
title: Perplexity Search
x-i18n:
    generated_at: "2026-04-05T14:08:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06d97498e26e5570364e1486cb75584ed53b40a0091bf0210e1ea62f62d562ea
    source_path: tools/perplexity-search.md
    workflow: 15
---

# Perplexity Search API

OpenClaw obsługuje Perplexity Search API jako dostawcę `web_search`.
Zwraca ustrukturyzowane wyniki z polami `title`, `url` i `snippet`.

Dla zgodności OpenClaw obsługuje także starsze konfiguracje Perplexity Sonar/OpenRouter.
Jeśli używasz `OPENROUTER_API_KEY`, klucza `sk-or-...` w `plugins.entries.perplexity.config.webSearch.apiKey` albo ustawisz `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, dostawca przełącza się na ścieżkę chat-completions i zwraca odpowiedzi syntetyzowane przez AI z cytatami zamiast ustrukturyzowanych wyników Search API.

## Uzyskanie klucza API Perplexity

1. Utwórz konto Perplexity na [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Wygeneruj klucz API w panelu
3. Zapisz klucz w konfiguracji albo ustaw `PERPLEXITY_API_KEY` w środowisku Gateway.

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

### Zgodność OpenRouter / Sonar

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

**Przez konfigurację:** uruchom `openclaw configure --section web`. Zapisuje klucz w
`~/.openclaw/openclaw.json` pod `plugins.entries.perplexity.config.webSearch.apiKey`.
To pole akceptuje także obiekty SecretRef.

**Przez środowisko:** ustaw `PERPLEXITY_API_KEY` albo `OPENROUTER_API_KEY`
w środowisku procesu Gateway. Dla instalacji gateway umieść je w
`~/.openclaw/.env` (albo w środowisku swojej usługi). Zobacz [Env vars](/help/faq#env-vars-and-env-loading).

Jeśli skonfigurowano `provider: "perplexity"` i SecretRef klucza Perplexity pozostaje nierozwiązany bez fallbacku env, uruchamianie/przeładowanie kończy się szybkim błędem.

## Parametry narzędzia

Te parametry mają zastosowanie do natywnej ścieżki Perplexity Search API.

| Parametr              | Opis                                                   |
| --------------------- | ------------------------------------------------------ |
| `query`               | Zapytanie wyszukiwania (wymagane)                      |
| `count`               | Liczba wyników do zwrócenia (1-10, domyślnie: 5)       |
| `country`             | 2-literowy kod kraju ISO (np. `"US"`, `"DE"`)          |
| `language`            | Kod języka ISO 639-1 (np. `"en"`, `"de"`, `"fr"`)      |
| `freshness`           | Filtr czasu: `day` (24h), `week`, `month` lub `year`   |
| `date_after`          | Tylko wyniki opublikowane po tej dacie (YYYY-MM-DD)    |
| `date_before`         | Tylko wyniki opublikowane przed tą datą (YYYY-MM-DD)   |
| `domain_filter`       | Tablica allowlist/denylist domen (maks. 20)            |
| `max_tokens`          | Całkowity budżet treści (domyślnie: 25000, maks.: 1000000) |
| `max_tokens_per_page` | Limit tokenów na stronę (domyślnie: 2048)              |

Dla starszej ścieżki zgodności Sonar/OpenRouter:

- akceptowane są `query`, `count` i `freshness`
- `count` służy tam wyłącznie zgodności; odpowiedź nadal jest jedną syntetyzowaną
  odpowiedzią z cytatami, a nie listą N wyników
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

// Filtrowanie domen (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Filtrowanie domen (denylist - prefiks -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Większa ekstrakcja treści
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Reguły filtra domen

- Maksymalnie 20 domen na filtr
- Nie można łączyć allowlist i denylist w jednym żądaniu
- Użyj prefiksu `-` dla wpisów denylist (np. `["-reddit.com"]`)

## Uwagi

- Perplexity Search API zwraca ustrukturyzowane wyniki wyszukiwania w Web (`title`, `url`, `snippet`)
- OpenRouter albo jawne `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` przełączają Perplexity z powrotem na chat completions Sonar dla zgodności
- Zgodność Sonar/OpenRouter zwraca jedną syntetyzowaną odpowiedź z cytatami, a nie ustrukturyzowane wiersze wyników
- Wyniki są domyślnie cache’owane przez 15 minut (konfigurowalne przez `cacheTtlMinutes`)

## Powiązane

- [Przegląd Web Search](/tools/web) -- wszyscy dostawcy i auto-detect
- [Dokumentacja Perplexity Search API](https://docs.perplexity.ai/docs/search/quickstart) -- oficjalna dokumentacja Perplexity
- [Brave Search](/tools/brave-search) -- ustrukturyzowane wyniki z filtrami kraju/języka
- [Exa Search](/tools/exa-search) -- wyszukiwanie neuronowe z ekstrakcją treści
