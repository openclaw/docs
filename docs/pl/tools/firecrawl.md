---
read_when:
    - Potrzebujesz ekstrakcji z sieci opartej na Firecrawl
    - Potrzebujesz klucza API Firecrawl
    - Chcesz używać Firecrawl jako dostawcy web_search
    - Potrzebujesz ekstrakcji antybotowej dla web_fetch
summary: Wyszukiwanie i scrapowanie w Firecrawl oraz mechanizm awaryjny web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-05-02T10:04:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0570fde055cf8028cddf78f1ba19225d10cccd0662f45d063f23a39b4a82a7e0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw może używać **Firecrawl** na trzy sposoby:

- jako dostawcy `web_search`
- jako jawnych narzędzi Plugin: `firecrawl_search` i `firecrawl_scrape`
- jako zapasowego ekstraktora dla `web_fetch`

Jest to hostowana usługa ekstrakcji/wyszukiwania, która obsługuje obchodzenie botów i buforowanie,
co pomaga przy stronach mocno opartych na JS lub stronach blokujących zwykłe pobieranie HTTP.

## Uzyskaj klucz API

1. Utwórz konto Firecrawl i wygeneruj klucz API.
2. Zapisz go w konfiguracji albo ustaw `FIRECRAWL_API_KEY` w środowisku Gateway.

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

- Wybranie Firecrawl podczas onboardingu lub w `openclaw configure --section web` automatycznie włącza dołączony Plugin Firecrawl.
- `web_search` z Firecrawl obsługuje `query` i `count`.
- Aby użyć kontrolek specyficznych dla Firecrawl, takich jak `sources`, `categories` lub scraping wyników, użyj `firecrawl_search`.
- `baseUrl` domyślnie wskazuje hostowany Firecrawl pod adresem `https://api.firecrawl.dev`. Nadpisania self-hosted są dozwolone tylko dla prywatnych/wewnętrznych endpointów; HTTP jest akceptowane tylko dla tych prywatnych celów.
- `FIRECRAWL_BASE_URL` to wspólny zapasowy env dla bazowych URL wyszukiwania i scrape Firecrawl.

## Skonfiguruj scrape Firecrawl + fallback web_fetch

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

- Próby fallback Firecrawl są uruchamiane tylko wtedy, gdy dostępny jest klucz API (`plugins.entries.firecrawl.config.webFetch.apiKey` lub `FIRECRAWL_API_KEY`).
- `maxAgeMs` kontroluje, jak stare mogą być wyniki z pamięci podręcznej (ms). Domyślnie są to 2 dni.
- Starsza konfiguracja `tools.web.fetch.firecrawl.*` jest automatycznie migrowana przez `openclaw doctor --fix`.
- Nadpisania URL scrape/base Firecrawl podlegają tej samej regule hosted/private co wyszukiwanie: publiczny ruch hostowany używa `https://api.firecrawl.dev`; nadpisania self-hosted muszą wskazywać prywatne/wewnętrzne endpointy.
- `firecrawl_scrape` odrzuca oczywiste prywatne, loopback, metadane i docelowe URL inne niż HTTP(S), zanim przekaże je do Firecrawl, zgodnie z kontraktem bezpieczeństwa celów `web_fetch` dla jawnych wywołań scrape Firecrawl.

`firecrawl_scrape` ponownie używa tych samych ustawień `plugins.entries.firecrawl.config.webFetch.*` i zmiennych env.

### Self-hosted Firecrawl

Ustaw `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` lub `FIRECRAWL_BASE_URL`,
gdy uruchamiasz Firecrawl samodzielnie. OpenClaw akceptuje `http://` tylko dla celów loopback,
sieci prywatnej, `.local`, `.internal` lub `.localhost`. Publiczne niestandardowe
hosty są odrzucane, aby klucze API Firecrawl nie zostały przypadkowo wysłane do dowolnych endpointów.

## Narzędzia Plugin Firecrawl

### `firecrawl_search`

Użyj tego, gdy chcesz użyć kontrolek wyszukiwania specyficznych dla Firecrawl zamiast ogólnego `web_search`.

Główne parametry:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Użyj tego dla stron mocno opartych na JS lub chronionych przed botami, dla których zwykły `web_fetch` jest słaby.

Główne parametry:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / obchodzenie botów

Firecrawl udostępnia parametr **proxy mode** do obchodzenia botów (`basic`, `stealth` lub `auto`).
OpenClaw zawsze używa `proxy: "auto"` oraz `storeInCache: true` dla żądań Firecrawl.
Jeśli proxy zostanie pominięte, Firecrawl domyślnie używa `auto`. `auto` ponawia próbę z proxy stealth, jeśli próba basic się nie powiedzie, co może zużyć więcej kredytów
niż scraping tylko w trybie basic.

## Jak `web_fetch` używa Firecrawl

Kolejność ekstrakcji `web_fetch`:

1. Readability (lokalnie)
2. Firecrawl (jeśli wybrany lub automatycznie wykryty jako aktywny fallback web-fetch)
3. Podstawowe czyszczenie HTML (ostatni fallback)

Pokrętłem wyboru jest `tools.web.fetch.provider`. Jeśli je pominiesz, OpenClaw
automatycznie wykrywa pierwszego gotowego dostawcę web-fetch na podstawie dostępnych poświadczeń.
Obecnie dołączonym dostawcą jest Firecrawl.

## Powiązane

- [Omówienie Web Search](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Web Fetch](/pl/tools/web-fetch) -- narzędzie web_fetch z fallback Firecrawl
- [Tavily](/pl/tools/tavily) -- narzędzia wyszukiwania i ekstrakcji
