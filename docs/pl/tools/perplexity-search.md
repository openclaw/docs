---
read_when:
    - Chcesz używać Perplexity Search do wyszukiwania w sieci
    - Potrzebujesz konfiguracji `PERPLEXITY_API_KEY` lub `OPENROUTER_API_KEY`
summary: Perplexity Search API i zgodność Sonar/OpenRouter dla `web_search`
title: Wyszukiwanie Perplexity
x-i18n:
    generated_at: "2026-04-24T09:37:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f85aa953ff406237013fdc9a06b86756a26e62d41e5a3e3aa732563960e4ba9
    source_path: tools/perplexity-search.md
    workflow: 15
---

# Interfejs API wyszukiwania Perplexity

OpenClaw obsługuje interfejs API wyszukiwania Perplexity jako dostawcę `web_search`.
Zwraca on ustrukturyzowane wyniki z polami `title`, `url` i `snippet`.

Dla zgodności OpenClaw obsługuje także starsze konfiguracje Perplexity Sonar/OpenRouter.
Jeśli używasz `OPENROUTER_API_KEY`, klucza `sk-or-...` w `plugins.entries.perplexity.config.webSearch.apiKey` albo ustawisz `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, dostawca przełącza się na ścieżkę chat completions i zwraca odpowiedzi syntetyzowane przez AI z cytowaniami zamiast ustrukturyzowanych wyników interfejsu API wyszukiwania.

## Uzyskanie klucza API Perplexity

1. Utwórz konto Perplexity na [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Wygeneruj klucz API w panelu
3. Zapisz klucz w konfiguracji albo ustaw `PERPLEXITY_API_KEY` w środowisku Gateway.

## Zgodność z OpenRouter

Jeśli wcześniej używano OpenRouter dla Perplexity Sonar, pozostaw `provider: "perplexity"` i ustaw `OPENROUTER_API_KEY` w środowisku Gateway albo zapisz klucz `sk-or-...` w `plugins.entries.perplexity.config.webSearch.apiKey`.

Opcjonalne ustawienia zgodności:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Przykłady konfiguracji

### Natywny interfejs API wyszukiwania Perplexity

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

**Przez konfigurację:** uruchom `openclaw configure --section web`. Zapisuje to klucz w
`~/.openclaw/openclaw.json` pod `plugins.entries.perplexity.config.webSearch.apiKey`.
To pole akceptuje także obiekty SecretRef.

**Przez środowisko:** ustaw `PERPLEXITY_API_KEY` lub `OPENROUTER_API_KEY`
w środowisku procesu Gateway. W przypadku instalacji Gateway umieść je w
`~/.openclaw/.env` (lub w środowisku swojej usługi). Zobacz [Zmienne środowiskowe](/pl/help/faq#env-vars-and-env-loading).

Jeśli skonfigurowano `provider: "perplexity"` i SecretRef klucza Perplexity nie jest rozwiązany bez fallbacku środowiskowego, uruchomienie/przeładowanie kończy się natychmiastowym błędem.

## Parametry narzędzia

Te parametry dotyczą natywnej ścieżki interfejsu API wyszukiwania Perplexity.

<ParamField path="query" type="string" required>
Zapytanie wyszukiwania.
</ParamField>

<ParamField path="count" type="number" default="5">
Liczba wyników do zwrócenia (1–10).
</ParamField>

<ParamField path="country" type="string">
2-literowy kod kraju ISO (np. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Kod języka ISO 639-1 (np. `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtr czasu — `day` oznacza 24 godziny.
</ParamField>

<ParamField path="date_after" type="string">
Tylko wyniki opublikowane po tej dacie (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Tylko wyniki opublikowane przed tą datą (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Tablica listy dozwolonych/zabronionych domen (maks. 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Całkowity budżet treści (maks. 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Limit tokenów na stronę.
</ParamField>

Dla starszej ścieżki zgodności Sonar/OpenRouter:

- akceptowane są `query`, `count` i `freshness`
- `count` służy tam tylko zgodności; odpowiedź nadal jest jedną syntetyzowaną
  odpowiedzią z cytowaniami zamiast listą N wyników
- filtry dostępne tylko w interfejsie API wyszukiwania, takie jak `country`, `language`, `date_after`,
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

// Filtrowanie domen (lista dozwolonych)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Filtrowanie domen (lista zabronionych - prefiks -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Większe wydobycie treści
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Zasady filtra domen

- Maksymalnie 20 domen na filtr
- Nie można mieszać listy dozwolonych i zabronionych w tym samym żądaniu
- Użyj prefiksu `-` dla wpisów listy zabronionych (np. `["-reddit.com"]`)

## Uwagi

- Interfejs API wyszukiwania Perplexity zwraca ustrukturyzowane wyniki wyszukiwania w sieci (`title`, `url`, `snippet`)
- OpenRouter albo jawne `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` przełączają Perplexity z powrotem na chat completions Sonar dla zgodności
- Zgodność Sonar/OpenRouter zwraca jedną syntetyzowaną odpowiedź z cytowaniami, a nie ustrukturyzowane wiersze wyników
- Wyniki są domyślnie cache’owane przez 15 minut (konfigurowalne przez `cacheTtlMinutes`)

## Powiązane

- [Przegląd Web Search](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Dokumentacja interfejsu API wyszukiwania Perplexity](https://docs.perplexity.ai/docs/search/quickstart) -- oficjalna dokumentacja Perplexity
- [Brave Search](/pl/tools/brave-search) -- ustrukturyzowane wyniki z filtrami kraju/języka
- [Exa Search](/pl/tools/exa-search) -- wyszukiwanie neuronowe z wydobywaniem treści
