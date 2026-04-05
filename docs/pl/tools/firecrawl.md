---
read_when:
    - Chcesz używać ekstrakcji webowej opartej na Firecrawl
    - Potrzebujesz klucza API Firecrawl
    - Chcesz używać Firecrawl jako dostawcy web_search
    - Chcesz używać ekstrakcji omijającej boty dla web_fetch
summary: Wyszukiwanie Firecrawl, scrapowanie i fallback web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-04-05T14:07:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 45f17fc4b8e81e1bfe25f510b0a64ab0d50c4cc95bcf88d6ba7c62cece26162e
    source_path: tools/firecrawl.md
    workflow: 15
---

# Firecrawl

OpenClaw może używać **Firecrawl** na trzy sposoby:

- jako dostawcy `web_search`
- jako jawnych narzędzi wtyczki: `firecrawl_search` i `firecrawl_scrape`
- jako awaryjnego ekstraktora dla `web_fetch`

Jest to hostowana usługa ekstrakcji/wyszukiwania, która obsługuje omijanie zabezpieczeń botów i cache,
co pomaga w przypadku stron intensywnie korzystających z JS lub stron blokujących zwykłe żądania HTTP fetch.

## Pobierz klucz API

1. Utwórz konto Firecrawl i wygeneruj klucz API.
2. Zapisz go w konfiguracji albo ustaw `FIRECRAWL_API_KEY` w środowisku gateway.

## Skonfiguruj wyszukiwanie Firecrawl

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

Uwagi:

- Wybranie Firecrawl podczas onboardingu albo w `openclaw configure --section web` automatycznie włącza dołączoną wtyczkę Firecrawl.
- `web_search` z Firecrawl obsługuje `query` i `count`.
- Dla kontrolek specyficznych dla Firecrawl, takich jak `sources`, `categories` lub scrapowanie wyników, użyj `firecrawl_search`.
- Nadpisania `baseUrl` muszą pozostać w obrębie `https://api.firecrawl.dev`.
- `FIRECRAWL_BASE_URL` jest współdzielonym fallbackiem środowiskowym dla adresów bazowych wyszukiwania i scrapowania Firecrawl.

## Skonfiguruj scrapowanie Firecrawl i fallback web_fetch

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

Uwagi:

- Próby fallbacku Firecrawl są wykonywane tylko wtedy, gdy dostępny jest klucz API (`plugins.entries.firecrawl.config.webFetch.apiKey` lub `FIRECRAWL_API_KEY`).
- `maxAgeMs` określa, jak stare mogą być wyniki z cache (w ms). Domyślnie są to 2 dni.
- Starsza konfiguracja `tools.web.fetch.firecrawl.*` jest automatycznie migrowana przez `openclaw doctor --fix`.
- Nadpisania adresu bazowego scrapowania/base URL Firecrawl są ograniczone do `https://api.firecrawl.dev`.

`firecrawl_scrape` używa ponownie tych samych ustawień `plugins.entries.firecrawl.config.webFetch.*` i tych samych zmiennych środowiskowych.

## Narzędzia wtyczki Firecrawl

### `firecrawl_search`

Użyj tego, jeśli chcesz korzystać z kontrolek wyszukiwania specyficznych dla Firecrawl zamiast z ogólnego `web_search`.

Główne parametry:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Użyj tego dla stron intensywnie korzystających z JS lub chronionych przed botami, gdzie zwykłe `web_fetch` działa słabo.

Główne parametry:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / omijanie zabezpieczeń botów

Firecrawl udostępnia parametr **proxy mode** do omijania zabezpieczeń botów (`basic`, `stealth` lub `auto`).
OpenClaw zawsze używa `proxy: "auto"` oraz `storeInCache: true` dla żądań Firecrawl.
Jeśli `proxy` zostanie pominięte, Firecrawl domyślnie używa `auto`. `auto` ponawia próbę z użyciem proxy stealth, jeśli podstawowa próba się nie powiedzie, co może zużywać więcej kredytów
niż scrapowanie tylko w trybie basic.

## Jak `web_fetch` używa Firecrawl

Kolejność ekstrakcji `web_fetch`:

1. Readability (lokalnie)
2. Firecrawl (jeśli wybrany lub automatycznie wykryty jako aktywny fallback web-fetch)
3. Podstawowe oczyszczanie HTML (ostatni fallback)

Pokrętłem wyboru jest `tools.web.fetch.provider`. Jeśli je pominiesz, OpenClaw
automatycznie wykryje pierwszego gotowego dostawcę web-fetch na podstawie dostępnych poświadczeń.
Obecnie dołączonym dostawcą jest Firecrawl.

## Powiązane

- [Przegląd Web Search](/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Web Fetch](/tools/web-fetch) -- narzędzie web_fetch z fallbackiem Firecrawl
- [Tavily](/tools/tavily) -- narzędzia wyszukiwania i ekstrakcji
