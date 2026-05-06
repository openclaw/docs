---
read_when:
    - Chcesz używać Perplexity Search do wyszukiwania w sieci
    - Musisz skonfigurować PERPLEXITY_API_KEY lub OPENROUTER_API_KEY
summary: Perplexity Search API i zgodność Sonar/OpenRouter z web_search
title: Wyszukiwanie Perplexity
x-i18n:
    generated_at: "2026-05-06T09:34:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 113abafae66acd8aaa0302b687ba13347eb44a81a4217b61bb68f07d8a119cb0
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw obsługuje Perplexity Search API jako dostawcę `web_search`.
Zwraca ustrukturyzowane wyniki z polami `title`, `url` i `snippet`.

Dla zgodności OpenClaw obsługuje także starsze konfiguracje Perplexity Sonar/OpenRouter.
Jeśli używasz `OPENROUTER_API_KEY`, klucza `sk-or-...` w `plugins.entries.perplexity.config.webSearch.apiKey` albo ustawiasz `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, dostawca przełącza się na ścieżkę chat-completions i zwraca odpowiedzi syntetyzowane przez AI z cytowaniami zamiast ustrukturyzowanych wyników Search API.

## Uzyskiwanie klucza API Perplexity

1. Utwórz konto Perplexity na [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Wygeneruj klucz API w panelu
3. Zapisz klucz w konfiguracji albo ustaw `PERPLEXITY_API_KEY` w środowisku Gateway.

## Zgodność z OpenRouter

Jeśli już używasz OpenRouter dla Perplexity Sonar, pozostaw `provider: "perplexity"` i ustaw `OPENROUTER_API_KEY` w środowisku Gateway albo zapisz klucz `sk-or-...` w `plugins.entries.perplexity.config.webSearch.apiKey`.

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
w środowisku procesu Gateway. W przypadku instalacji gateway umieść go w
`~/.openclaw/.env` (lub w środowisku swojej usługi). Zobacz [zmienne środowiskowe](/pl/help/faq#env-vars-and-env-loading).

Jeśli skonfigurowano `provider: "perplexity"`, a SecretRef klucza Perplexity nie zostanie rozwiązany i nie ma awaryjnej wartości ze środowiska, uruchamianie/ponowne ładowanie szybko kończy się błędem.

## Parametry narzędzia

Te parametry dotyczą natywnej ścieżki Perplexity Search API.

<ParamField path="query" type="string" required>
Zapytanie wyszukiwania.
</ParamField>

<ParamField path="count" type="number" default="5">
Liczba wyników do zwrócenia (1-10).
</ParamField>

<ParamField path="country" type="string">
2-literowy kod kraju ISO (np. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Kod języka ISO 639-1 (np. `en`, `de`, `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtr czasu - `day` oznacza 24 godziny.
</ParamField>

<ParamField path="date_after" type="string">
Tylko wyniki opublikowane po tej dacie (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Tylko wyniki opublikowane przed tą datą (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
Tablica listy dozwolonych/zablokowanych domen (maks. 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Łączny budżet treści (maks. 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Limit tokenów na stronę.
</ParamField>

Dla starszej ścieżki zgodności Sonar/OpenRouter:

- `query`, `count` i `freshness` są akceptowane
- `count` służy tam tylko do zgodności; odpowiedź nadal jest jedną syntetyzowaną
  odpowiedzią z cytowaniami, a nie listą N wyników
- Filtry dostępne tylko w Search API, takie jak `country`, `language`, `date_after`,
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

### Reguły filtra domen

- Maksymalnie 20 domen na filtr
- Nie można mieszać listy dozwolonych i listy zablokowanych w tym samym żądaniu
- Użyj prefiksu `-` dla wpisów listy zablokowanych (np. `["-reddit.com"]`)

## Uwagi

- Perplexity Search API zwraca ustrukturyzowane wyniki wyszukiwania w sieci (`title`, `url`, `snippet`)
- OpenRouter albo jawne `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` przełącza Perplexity z powrotem na chat completions Sonar dla zgodności
- Zgodność Sonar/OpenRouter zwraca jedną syntetyzowaną odpowiedź z cytowaniami, a nie ustrukturyzowane wiersze wyników
- Wyniki są domyślnie buforowane przez 15 minut (konfigurowalne przez `cacheTtlMinutes`)

## Powiązane

<CardGroup cols={2}>
  <Card title="Web search overview" href="/pl/tools/web" icon="globe">
    Wszyscy dostawcy i reguły automatycznego wykrywania.
  </Card>
  <Card title="Brave search" href="/pl/tools/brave-search" icon="shield">
    Ustrukturyzowane wyniki z filtrami kraju i języka.
  </Card>
  <Card title="Exa search" href="/pl/tools/exa-search" icon="magnifying-glass">
    Wyszukiwanie neuronowe z wyodrębnianiem treści.
  </Card>
  <Card title="Perplexity Search API docs" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Oficjalny szybki start i dokumentacja referencyjna Perplexity Search API.
  </Card>
</CardGroup>
