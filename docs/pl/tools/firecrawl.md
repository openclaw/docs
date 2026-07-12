---
read_when:
    - Chcesz wyodrębniać dane z internetu za pomocą Firecrawl
    - Chcesz korzystać z Firecrawl web_fetch bez klucza
    - Do wyszukiwania lub wyższych limitów potrzebujesz klucza API Firecrawl
    - Chcesz używać Firecrawl jako dostawcy web_search
    - Potrzebujesz mechanizmu obchodzenia zabezpieczeń przed botami dla `web_fetch`
summary: Wyszukiwanie i pobieranie danych za pomocą Firecrawl oraz rozwiązanie rezerwowe dla web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-07-12T15:45:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw może korzystać z **Firecrawl** na trzy sposoby:

- jako dostawcy `web_search`
- jako jawnych narzędzi pluginu: `firecrawl_search` i `firecrawl_scrape`
- jako zapasowego mechanizmu wyodrębniania dla `web_fetch`

Jest to hostowana usługa wyodrębniania i wyszukiwania, która obsługuje omijanie zabezpieczeń przed botami oraz buforowanie, co pomaga w przypadku witryn intensywnie korzystających z JS lub stron blokujących zwykłe pobieranie przez HTTP.

## Instalowanie pluginu

Zainstaluj oficjalny plugin, a następnie uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## `web_fetch` bez klucza i klucze API

Jawnie wybrany hostowany zapasowy mechanizm Firecrawl dla `web_fetch` zapewnia dostęp startowy bez klucza API. Dodaj `FIRECRAWL_API_KEY` w środowisku Gateway lub skonfiguruj go, gdy potrzebujesz wyższych limitów. Firecrawl `web_search` i `firecrawl_scrape` wymagają klucza API.

## Konfigurowanie wyszukiwania Firecrawl

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

- Wybranie Firecrawl podczas wdrażania lub za pomocą `openclaw configure --section web` automatycznie włącza zainstalowany plugin Firecrawl.
- `web_search` z Firecrawl obsługuje parametry `query` i `count`.
- Aby użyć ustawień charakterystycznych dla Firecrawl, takich jak `sources`, `categories` lub pobieranie treści wyników, użyj `firecrawl_search`.
- `baseUrl` domyślnie wskazuje na hostowaną usługę Firecrawl pod adresem `https://api.firecrawl.dev`. Zastąpienie go adresem samodzielnie hostowanej usługi jest dozwolone tylko w przypadku prywatnych lub wewnętrznych punktów końcowych; protokół HTTP jest akceptowany wyłącznie dla takich prywatnych celów.
- `FIRECRAWL_BASE_URL` jest współdzieloną zmienną środowiskową używaną jako wartość zapasowa bazowych adresów URL wyszukiwania i pobierania treści Firecrawl.
- Domyślny limit czasu żądań wyszukiwania Firecrawl wynosi 30 sekund; parametr `timeoutSeconds` narzędzia `firecrawl_search` zastępuje go dla danego wywołania.

## Konfigurowanie zapasowego mechanizmu Firecrawl dla `web_fetch`

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // jawny wybór włącza tryb zapasowy bez klucza
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

- Jawnie wybrany zapasowy mechanizm Firecrawl dla `web_fetch` działa bez klucza API. Po skonfigurowaniu OpenClaw wysyła `plugins.entries.firecrawl.config.webFetch.apiKey` lub `FIRECRAWL_API_KEY`, aby uzyskać wyższe limity.
- Wybranie Firecrawl podczas wdrażania lub za pomocą `openclaw configure --section web` włącza plugin i wybiera Firecrawl dla `web_fetch`, chyba że skonfigurowano już innego dostawcę pobierania.
- `firecrawl_scrape` wymaga klucza API.
- `maxAgeMs` określa maksymalny wiek wyników w pamięci podręcznej (w ms). Wartość domyślna to 172 800 000 ms (2 dni).
- Domyślna wartość `onlyMainContent` to `true`, a `timeoutSeconds` — 60.
- Starsza konfiguracja `tools.web.fetch.firecrawl.*` i `tools.web.search.firecrawl.*` jest automatycznie migrowana przez `openclaw doctor --fix`.
- Zastępowanie bazowego adresu URL pobierania treści Firecrawl podlega tej samej regule dotyczącej hostowania i adresów prywatnych co wyszukiwanie: publiczny ruch do usługi hostowanej korzysta z `https://api.firecrawl.dev`, a adresy zastępcze samodzielnie hostowanych usług muszą wskazywać prywatne lub wewnętrzne punkty końcowe.
- Przed przekazaniem adresów URL do Firecrawl narzędzie `firecrawl_scrape` odrzuca ewidentnie prywatne adresy docelowe, adresy local loopback, adresy metadanych oraz adresy korzystające z protokołów innych niż HTTP(S), zgodnie z zasadami bezpieczeństwa celów `web_fetch` dla jawnych wywołań pobierania treści przez Firecrawl.

`firecrawl_scrape` używa ponownie tych samych ustawień i zmiennych środowiskowych `plugins.entries.firecrawl.config.webFetch.*`, w tym wymaganego klucza API.

### Samodzielnie hostowany Firecrawl

Ustaw `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` lub `FIRECRAWL_BASE_URL`, jeśli uruchamiasz Firecrawl samodzielnie. OpenClaw akceptuje `http://` tylko dla celów local loopback, sieci prywatnej, `.local`, `.internal` lub `.localhost`. Publiczne niestandardowe hosty są odrzucane, aby klucze API Firecrawl nie zostały przypadkowo wysłane do dowolnych punktów końcowych.

## Narzędzia pluginu Firecrawl

### `firecrawl_search`

Użyj tego narzędzia, jeśli zamiast ogólnego `web_search` potrzebujesz ustawień wyszukiwania charakterystycznych dla Firecrawl.

Parametry:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Użyj tego narzędzia w przypadku stron intensywnie korzystających z JS lub chronionych przed botami, z którymi zwykłe `web_fetch` radzi sobie słabo.

Parametry:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Tryb niewykrywalny i omijanie zabezpieczeń przed botami

`firecrawl_scrape` i zapasowy mechanizm Firecrawl dla `web_fetch` domyślnie używają `proxy: "auto"` oraz `storeInCache: true`, chyba że wywołujący zastąpi te parametry. `firecrawl_search` i dostawca Firecrawl dla `web_search` nie udostępniają ustawień `proxy` ani `storeInCache`; tryb niewykrywalnego serwera proxy ma zastosowanie tylko do żądań pobierania treści i pobierania stron.

Tryb `proxy` Firecrawl steruje omijaniem zabezpieczeń przed botami (`basic`, `stealth` lub `auto`). W trybie `auto` po niepowodzeniu podstawowej próby żądanie jest ponawiane przy użyciu niewykrywalnych serwerów proxy, co może zużywać więcej środków niż pobieranie wyłącznie w trybie podstawowym.

## Jak `web_fetch` korzysta z Firecrawl

Kolejność wyodrębniania przez `web_fetch`:

1. Readability (lokalnie)
2. Skonfigurowany dostawca pobierania, taki jak Firecrawl (gdy został wybrany lub automatycznie wykryty na podstawie skonfigurowanych danych uwierzytelniających)
3. Podstawowe oczyszczanie kodu HTML (ostatni mechanizm zapasowy)

Ustawienie wyboru to `tools.web.fetch.provider`. Jeśli je pominiesz, OpenClaw automatycznie wykryje pierwszego gotowego dostawcę pobierania stron na podstawie dostępnych danych uwierzytelniających. Oficjalny plugin Firecrawl zapewnia ten mechanizm zapasowy.

## Powiązane

- [Omówienie wyszukiwania w internecie](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Pobieranie stron internetowych](/pl/tools/web-fetch) -- narzędzie `web_fetch` z zapasowym mechanizmem Firecrawl
- [Tavily](/pl/tools/tavily) -- narzędzia wyszukiwania i wyodrębniania
