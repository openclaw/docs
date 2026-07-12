---
read_when:
    - Chcesz używać Perplexity Search do wyszukiwania w internecie
    - Musisz skonfigurować `PERPLEXITY_API_KEY` lub `OPENROUTER_API_KEY`
summary: Interfejs Perplexity Search API i zgodność Sonar/OpenRouter z web_search
title: Wyszukiwanie Perplexity
x-i18n:
    generated_at: "2026-07-12T15:46:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7ca97355110e70a05f1d57acab475dda8dec89393804df40c6e9be5e30780e8
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw obsługuje interfejs Perplexity Search API jako dostawcę `web_search`. Zwraca on uporządkowane wyniki z polami `title`, `url` i `snippet`.

W celu zapewnienia zgodności OpenClaw obsługuje również starsze konfiguracje Perplexity Sonar/OpenRouter. Jeśli używasz `OPENROUTER_API_KEY`, klucza `sk-or-...` w `plugins.entries.perplexity.config.webSearch.apiKey` albo ustawisz `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`, dostawca przełącza się na ścieżkę uzupełnień czatu i zamiast uporządkowanych wyników Search API zwraca odpowiedzi zsyntetyzowane przez AI wraz z cytowaniami.

## Instalowanie pluginu

Zainstaluj oficjalny plugin, a następnie uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Uzyskiwanie klucza API Perplexity

1. Utwórz konto Perplexity na stronie [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api).
2. Wygeneruj klucz API w panelu.
3. Zapisz klucz w konfiguracji lub ustaw `PERPLEXITY_API_KEY` w środowisku Gateway.

## Zgodność z OpenRouter

Jeśli używasz już OpenRouter z Perplexity Sonar, pozostaw `provider: "perplexity"` i ustaw `OPENROUTER_API_KEY` w środowisku Gateway albo zapisz klucz `sk-or-...` w `plugins.entries.perplexity.config.webSearch.apiKey`.

Opcjonalne ustawienia zgodności:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## Przykłady konfiguracji

### Natywny interfejs Perplexity Search API

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

**Za pomocą konfiguracji:** uruchom `openclaw configure --section web`. Polecenie zapisze klucz w `~/.openclaw/openclaw.json` w polu `plugins.entries.perplexity.config.webSearch.apiKey`. To pole akceptuje również obiekty SecretRef.

**Za pomocą środowiska:** ustaw `PERPLEXITY_API_KEY` lub `OPENROUTER_API_KEY` w środowisku procesu Gateway. W przypadku instalacji Gateway umieść go w `~/.openclaw/.env` (lub w środowisku usługi). Zobacz [Zmienne środowiskowe](/pl/help/faq#env-vars-and-env-loading).

Jeśli skonfigurowano `provider: "perplexity"`, a odwołanie SecretRef do klucza Perplexity pozostaje nierozwiązane i nie ma wartości zastępczej w środowisku, uruchamianie lub ponowne wczytywanie natychmiast kończy się niepowodzeniem.

## Parametry narzędzia

Te parametry dotyczą natywnej ścieżki Perplexity Search API.

<ParamField path="query" type="string" required>
Zapytanie wyszukiwania.
</ParamField>

<ParamField path="count" type="number" default="5">
Liczba zwracanych wyników (1–10).
</ParamField>

<ParamField path="country" type="string">
Dwuliterowy kod kraju ISO (np. `US`, `DE`).
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
Tablica dozwolonych lub zabronionych domen (maksymalnie 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
Łączny limit zawartości (maksymalnie 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
Limit tokenów na stronę.
</ParamField>

W przypadku starszej ścieżki zgodności z Sonar/OpenRouter:

- Akceptowane są `query`, `count` i `freshness`.
- `count` służy tam wyłącznie do zapewnienia zgodności; odpowiedź nadal jest jedną zsyntetyzowaną odpowiedzią z cytowaniami, a nie listą N wyników.
- Filtry dostępne wyłącznie w Search API (`country`, `language`, `date_after`, `date_before`, `domain_filter`, `max_tokens`, `max_tokens_per_page`) zwracają jednoznaczne błędy.

**Przykłady:**

```javascript
// Wyszukiwanie z określonym krajem i językiem
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Najnowsze wyniki (z ostatniego tygodnia)
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

// Filtrowanie domen (lista zabronionych — prefiks -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// Pobieranie większej ilości treści
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### Reguły filtrowania domen

- Maksymalnie 20 domen na filtr.
- W jednym żądaniu nie można łączyć wpisów listy dozwolonych i listy zabronionych.
- W przypadku wpisów listy zabronionych użyj prefiksu `-` (np. `["-reddit.com"]`).

## Uwagi

- Perplexity Search API zwraca uporządkowane wyniki wyszukiwania internetowego (`title`, `url`, `snippet`).
- OpenRouter lub jawne ustawienie `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` przełącza Perplexity z powrotem na uzupełnienia czatu Sonar w celu zapewnienia zgodności.
- Tryb zgodności z Sonar/OpenRouter zwraca jedną zsyntetyzowaną odpowiedź z cytowaniami, a nie uporządkowane wiersze wyników.
- Wyniki są domyślnie przechowywane w pamięci podręcznej przez 15 minut (wartość można skonfigurować za pomocą `cacheTtlMinutes`).

## Powiązane

<CardGroup cols={2}>
  <Card title="Omówienie wyszukiwania internetowego" href="/pl/tools/web" icon="globe">
    Wszyscy dostawcy i reguły automatycznego wykrywania.
  </Card>
  <Card title="Wyszukiwanie Brave" href="/pl/tools/brave-search" icon="shield">
    Uporządkowane wyniki z filtrami kraju i języka.
  </Card>
  <Card title="Wyszukiwanie Exa" href="/pl/tools/exa-search" icon="magnifying-glass">
    Wyszukiwanie neuronowe z pobieraniem treści.
  </Card>
  <Card title="Dokumentacja Perplexity Search API" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Oficjalny przewodnik szybkiego startu i dokumentacja referencyjna Perplexity Search API.
  </Card>
</CardGroup>
