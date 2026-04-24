---
read_when:
    - Chcesz używać Perplexity Search do wyszukiwania w sieci
    - Potrzebujesz skonfigurowanego `PERPLEXITY_API_KEY` lub `OPENROUTER_API_KEY`
summary: API wyszukiwania Perplexity i zgodność Sonar/OpenRouter dla `web_search`
title: Wyszukiwanie Perplexity (starsza ścieżka)
x-i18n:
    generated_at: "2026-04-24T09:19:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87a7b6e14f636cfe6b7c5833af1b0aecb334a39babbb779c32f29bbbb5c9e14a
    source_path: perplexity.md
    workflow: 15
---

# API wyszukiwania Perplexity

OpenClaw obsługuje API wyszukiwania Perplexity jako providera `web_search`.
Zwraca ono uporządkowane wyniki z polami `title`, `url` i `snippet`.

Dla zgodności OpenClaw obsługuje także starsze konfiguracje Perplexity Sonar/OpenRouter.
Jeśli używasz `OPENROUTER_API_KEY`, klucza `sk-or-...` w `plugins.entries.perplexity.config.webSearch.apiKey` albo ustawisz `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, provider przełącza się na ścieżkę chat-completions i zwraca odpowiedzi syntetyzowane przez AI z cytowaniami zamiast uporządkowanych wyników Search API.

## Jak uzyskać klucz API Perplexity

1. Utwórz konto Perplexity na [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Wygeneruj klucz API w panelu
3. Zapisz klucz w konfiguracji albo ustaw `PERPLEXITY_API_KEY` w środowisku Gateway.

## Zgodność z OpenRouter

Jeśli używałeś już OpenRouter dla Perplexity Sonar, zachowaj `provider: "perplexity"` i ustaw `OPENROUTER_API_KEY` w środowisku Gateway albo zapisz klucz `sk-or-...` w `plugins.entries.perplexity.config.webSearch.apiKey`.

Opcjonalne ustawienia zgodności:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Przykłady konfiguracji

### Natywne API wyszukiwania Perplexity

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
To pole akceptuje również obiekty SecretRef.

**Przez środowisko:** ustaw `PERPLEXITY_API_KEY` lub `OPENROUTER_API_KEY`
w środowisku procesu Gateway. W instalacji gateway umieść go w
`~/.openclaw/.env` (lub w środowisku swojej usługi). Zobacz [Zmienne env](/pl/help/faq#env-vars-and-env-loading).

Jeśli skonfigurowano `provider: "perplexity"` i SecretRef klucza Perplexity jest nierozwiązany bez awaryjnego powrotu do env, start/reload kończy się natychmiast błędem.

## Parametry narzędzia

Te parametry dotyczą natywnej ścieżki API wyszukiwania Perplexity.

| Parametr              | Opis                                                    |
| --------------------- | ------------------------------------------------------- |
| `query`               | Zapytanie wyszukiwania (wymagane)                       |
| `count`               | Liczba wyników do zwrócenia (1-10, domyślnie: 5)        |
| `country`             | 2-literowy kod kraju ISO (np. `"US"`, `"DE"`)          |
| `language`            | Kod języka ISO 639-1 (np. `"en"`, `"de"`, `"fr"`)      |
| `freshness`           | Filtr czasu: `day` (24h), `week`, `month` lub `year`    |
| `date_after`          | Tylko wyniki opublikowane po tej dacie (YYYY-MM-DD)     |
| `date_before`         | Tylko wyniki opublikowane przed tą datą (YYYY-MM-DD)    |
| `domain_filter`       | Tablica allowlisty/denylisty domen (maks. 20)           |
| `max_tokens`          | Łączny budżet treści (domyślnie: 25000, maks.: 1000000) |
| `max_tokens_per_page` | Limit tokenów na stronę (domyślnie: 2048)               |

Dla starszej ścieżki zgodności Sonar/OpenRouter:

- akceptowane są `query`, `count` i `freshness`
- `count` jest tam tylko dla zgodności; odpowiedź nadal pozostaje jedną odpowiedzią syntetyzowaną
  z cytowaniami zamiast listy N wyników
- filtry dostępne tylko w Search API, takie jak `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens` i `max_tokens_per_page`,
  zwracają jawne błędy

**Przykłady:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Domain filtering (denylist - prefix with -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// More content extraction
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Reguły `domain_filter`

- Maksymalnie 20 domen na filtr
- Nie można mieszać allowlisty i denylisty w tym samym żądaniu
- Użyj prefiksu `-` dla wpisów denylisty (np. `["-reddit.com"]`)

## Uwagi

- API wyszukiwania Perplexity zwraca uporządkowane wyniki wyszukiwania w sieci (`title`, `url`, `snippet`)
- OpenRouter lub jawne `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` przełączają Perplexity z powrotem na Sonar chat completions dla zgodności
- Zgodność Sonar/OpenRouter zwraca jedną odpowiedź syntetyzowaną z cytowaniami, a nie uporządkowane wiersze wyników
- Wyniki są domyślnie buforowane przez 15 minut (konfigurowalne przez `cacheTtlMinutes`)

Pełną konfigurację `web_search` znajdziesz w [Narzędzia web](/pl/tools/web).
Więcej szczegółów znajdziesz w [dokumentacji API wyszukiwania Perplexity](https://docs.perplexity.ai/docs/search/quickstart).

## Powiązane

- [Wyszukiwanie Perplexity](/pl/tools/perplexity-search)
- [Wyszukiwanie w sieci](/pl/tools/web)
