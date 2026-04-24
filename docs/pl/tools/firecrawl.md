---
read_when:
    - Chcesz używać ekstrakcji z sieci opartej na Firecrawl
    - Potrzebujesz klucza API Firecrawl
    - Chcesz używać Firecrawl jako providera `web_search`
    - Chcesz używać ekstrakcji omijającej zabezpieczenia antybotowe dla `web_fetch`
summary: Firecrawl search, scrape i fallback `web_fetch`
title: Firecrawl
x-i18n:
    generated_at: "2026-04-24T09:36:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9cd7a56c3a5c7d7876daddeef9acdbe25272404916250bdf40d1d7ad31388f19
    source_path: tools/firecrawl.md
    workflow: 15
---

OpenClaw może używać **Firecrawl** na trzy sposoby:

- jako providera `web_search`
- jako jawnych narzędzi Pluginu: `firecrawl_search` i `firecrawl_scrape`
- jako mechanizmu ekstrakcji awaryjnej dla `web_fetch`

Jest to hostowana usługa ekstrakcji/wyszukiwania, która obsługuje omijanie zabezpieczeń botowych i buforowanie,
co pomaga w przypadku stron intensywnie używających JS lub stron blokujących zwykłe pobieranie HTTP.

## Uzyskaj klucz API

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

- Wybranie Firecrawl podczas onboardingu lub przez `openclaw configure --section web` automatycznie włącza dołączony Plugin Firecrawl.
- `web_search` z Firecrawl obsługuje `query` i `count`.
- Dla ustawień specyficznych dla Firecrawl, takich jak `sources`, `categories` czy scrape wyników, użyj `firecrawl_search`.
- Nadpisania `baseUrl` muszą pozostać przy `https://api.firecrawl.dev`.
- `FIRECRAWL_BASE_URL` jest współdzielonym awaryjnym env dla bazowych URL wyszukiwania i scrape Firecrawl.

## Skonfiguruj scrape Firecrawl + fallback `web_fetch`

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

- Próby użycia fallbacku Firecrawl są wykonywane tylko wtedy, gdy dostępny jest klucz API (`plugins.entries.firecrawl.config.webFetch.apiKey` lub `FIRECRAWL_API_KEY`).
- `maxAgeMs` określa, jak stare mogą być wyniki z cache (ms). Domyślnie 2 dni.
- Starsza konfiguracja `tools.web.fetch.firecrawl.*` jest automatycznie migrowana przez `openclaw doctor --fix`.
- Nadpisania bazowego URL scrape/base URL Firecrawl są ograniczone do `https://api.firecrawl.dev`.

`firecrawl_scrape` używa ponownie tych samych ustawień i zmiennych env z `plugins.entries.firecrawl.config.webFetch.*`.

## Narzędzia Pluginu Firecrawl

### `firecrawl_search`

Użyj tego, gdy chcesz korzystać z ustawień wyszukiwania specyficznych dla Firecrawl zamiast ogólnego `web_search`.

Główne parametry:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Użyj tego dla stron intensywnie używających JS lub chronionych przed botami, gdzie zwykłe `web_fetch` działa słabo.

Główne parametry:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / omijanie zabezpieczeń botowych

Firecrawl udostępnia parametr **proxy mode** do omijania zabezpieczeń botowych (`basic`, `stealth` lub `auto`).
OpenClaw zawsze używa `proxy: "auto"` oraz `storeInCache: true` dla żądań Firecrawl.
Jeśli `proxy` zostanie pominięte, Firecrawl domyślnie używa `auto`. `auto` ponawia próbę z proxy stealth, jeśli podstawowa próba się nie powiedzie, co może zużywać więcej kredytów
niż scrape tylko w trybie basic.

## Jak `web_fetch` używa Firecrawl

Kolejność ekstrakcji `web_fetch`:

1. Readability (lokalnie)
2. Firecrawl (jeśli wybrano go lub został automatycznie wykryty jako aktywny fallback web-fetch)
3. Podstawowe czyszczenie HTML (ostatni fallback)

Przełącznikiem wyboru jest `tools.web.fetch.provider`. Jeśli go pominiesz, OpenClaw
automatycznie wykrywa pierwszego gotowego providera web-fetch na podstawie dostępnych danych uwierzytelniających.
Obecnie dołączonym providerem jest Firecrawl.

## Powiązane

- [Przegląd wyszukiwania w sieci](/pl/tools/web) -- wszyscy providerzy i automatyczne wykrywanie
- [Web Fetch](/pl/tools/web-fetch) -- narzędzie `web_fetch` z fallbackiem Firecrawl
- [Tavily](/pl/tools/tavily) -- narzędzia wyszukiwania i ekstrakcji
