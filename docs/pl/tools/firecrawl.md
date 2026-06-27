---
read_when:
    - Chcesz ekstrakcji z sieci opartej na Firecrawl
    - Chcesz Firecrawl web_fetch bez klucza
    - Potrzebujesz klucza API Firecrawl do wyszukiwania lub wyższych limitów
    - Chcesz używać Firecrawl jako dostawcy web_search
    - Potrzebujesz ekstrakcji zabezpieczonej przed botami dla web_fetch
summary: Wyszukiwanie i scraping Firecrawl oraz awaryjny web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-06-27T18:26:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8f6ef7ea3711e8e3e55d6eec4a99397dec4efc548c7192924fdd5850cb270bf
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw może używać **Firecrawl** na trzy sposoby:

- jako dostawcy `web_search`
- jako jawnych narzędzi pluginu: `firecrawl_search` i `firecrawl_scrape`
- jako zapasowego ekstraktora dla `web_fetch`

Jest to hostowana usługa ekstrakcji/wyszukiwania obsługująca obchodzenie zabezpieczeń przed botami i buforowanie,
co pomaga w przypadku stron intensywnie korzystających z JS lub stron blokujących zwykłe pobieranie HTTP.

## Zainstaluj plugin

Zainstaluj oficjalny plugin, a następnie uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## web_fetch bez klucza i klucze API

Jawnie wybrany hostowany zapasowy Firecrawl `web_fetch` obsługuje dostęp startowy
bez klucza API. Dodaj `FIRECRAWL_API_KEY` w środowisku gateway
albo skonfiguruj go, gdy potrzebujesz wyższych limitów. Firecrawl `web_search` i
`firecrawl_scrape` wymagają klucza API.

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

- Wybranie Firecrawl podczas wdrażania lub przez `openclaw configure --section web` automatycznie włącza zainstalowany plugin Firecrawl.
- `web_search` z Firecrawl obsługuje `query` i `count`.
- W przypadku kontrolek specyficznych dla Firecrawl, takich jak `sources`, `categories` lub scraping wyników, użyj `firecrawl_search`.
- `baseUrl` domyślnie wskazuje hostowany Firecrawl pod adresem `https://api.firecrawl.dev`. Nadpisania self-hosted są dozwolone tylko dla prywatnych/wewnętrznych punktów końcowych; HTTP jest akceptowany tylko dla tych prywatnych celów.
- `FIRECRAWL_BASE_URL` to wspólna zapasowa zmienna środowiskowa dla bazowych adresów URL wyszukiwania i scrapingu Firecrawl.

## Skonfiguruj zapasowy Firecrawl web_fetch

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // explicit selection enables keyless fallback
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
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

- Jawnie wybrany zapasowy Firecrawl `web_fetch` działa bez klucza API. Po skonfigurowaniu OpenClaw wysyła `plugins.entries.firecrawl.config.webFetch.apiKey` lub `FIRECRAWL_API_KEY` w celu uzyskania wyższych limitów.
- Wybranie Firecrawl podczas wdrażania lub przez `openclaw configure --section web` włącza plugin i wybiera Firecrawl dla `web_fetch`, chyba że skonfigurowano już innego dostawcę pobierania.
- `firecrawl_scrape` wymaga klucza API.
- `maxAgeMs` kontroluje, jak stare mogą być wyniki z pamięci podręcznej (ms). Wartość domyślna to 2 dni.
- Starsza konfiguracja `tools.web.fetch.firecrawl.*` jest automatycznie migrowana przez `openclaw doctor --fix`.
- Nadpisania scrapingu/bazowego URL Firecrawl stosują tę samą regułę hostowane/prywatne co wyszukiwanie: publiczny ruch hostowany używa `https://api.firecrawl.dev`; nadpisania self-hosted muszą wskazywać prywatne/wewnętrzne punkty końcowe.
- `firecrawl_scrape` odrzuca oczywiste prywatne, loopback, metadanych i inne niż HTTP(S) docelowe adresy URL przed przekazaniem ich do Firecrawl, zgodnie z kontraktem bezpieczeństwa celu `web_fetch` dla jawnych wywołań scrapingu Firecrawl.

`firecrawl_scrape` ponownie używa tych samych ustawień `plugins.entries.firecrawl.config.webFetch.*` i zmiennych środowiskowych, w tym wymaganego klucza API.

### Self-hosted Firecrawl

Ustaw `plugins.entries.firecrawl.config.webSearch.baseUrl`,
`plugins.entries.firecrawl.config.webFetch.baseUrl` lub `FIRECRAWL_BASE_URL`,
gdy uruchamiasz Firecrawl samodzielnie. OpenClaw akceptuje `http://` tylko dla celów loopback,
sieci prywatnej, `.local`, `.internal` lub `.localhost`. Publiczne niestandardowe
hosty są odrzucane, aby klucze API Firecrawl nie zostały przypadkowo wysłane do
dowolnych punktów końcowych.

## Narzędzia pluginu Firecrawl

### `firecrawl_search`

Użyj tego, gdy chcesz użyć kontrolek wyszukiwania specyficznych dla Firecrawl zamiast ogólnego `web_search`.

Podstawowe parametry:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Użyj tego dla stron intensywnie korzystających z JS lub chronionych przed botami, gdzie zwykły `web_fetch` jest niewystarczający.

Podstawowe parametry:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / obchodzenie zabezpieczeń przed botami

Firecrawl udostępnia parametr **trybu proxy** do obchodzenia zabezpieczeń przed botami (`basic`, `stealth` lub `auto`).
OpenClaw zawsze używa `proxy: "auto"` oraz `storeInCache: true` dla żądań Firecrawl.
Jeśli proxy zostanie pominięte, Firecrawl domyślnie używa `auto`. `auto` ponawia próbę z proxy stealth, jeśli próba basic się nie powiedzie, co może zużyć więcej kredytów
niż scraping tylko w trybie basic.

## Jak `web_fetch` używa Firecrawl

Kolejność ekstrakcji `web_fetch`:

1. Readability (lokalnie)
2. Firecrawl (gdy wybrany lub automatycznie wykryty na podstawie skonfigurowanych poświadczeń)
3. Podstawowe czyszczenie HTML (ostatnia opcja zapasowa)

Pokrętłem wyboru jest `tools.web.fetch.provider`. Jeśli je pominiesz, OpenClaw
automatycznie wykrywa pierwszego gotowego dostawcę web-fetch na podstawie dostępnych poświadczeń.
Oficjalny plugin Firecrawl zapewnia tę opcję zapasową.

## Powiązane

- [Omówienie Web Search](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Web Fetch](/pl/tools/web-fetch) -- narzędzie web_fetch z zapasowym Firecrawl
- [Tavily](/pl/tools/tavily) -- narzędzia wyszukiwania i ekstrakcji
