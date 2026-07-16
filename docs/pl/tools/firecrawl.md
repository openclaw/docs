---
read_when:
    - Potrzebna jest ekstrakcja treści z internetu oparta na Firecrawl
    - Potrzebne jest wyszukiwanie Firecrawl bez klucza (bezpłatne) lub `web_fetch` bez klucza
    - Potrzebny jest klucz API Firecrawl do wyszukiwania lub uzyskania wyższych limitów
    - Chcesz używać Firecrawl jako dostawcy web_search
    - Potrzebujesz mechanizmu omijania zabezpieczeń przed botami dla `web_fetch`
summary: Wyszukiwanie i pobieranie danych przez Firecrawl oraz rozwiązanie awaryjne dla web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-07-16T19:13:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 98b8af0839b1759e3be9393879a6d9a92fa0c505bf475bafd73c3f32d20fa106
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw może korzystać z **Firecrawl** na trzy sposoby:

- jako dostawcy `web_search`
- jako jawnie wywoływanych narzędzi pluginu: `firecrawl_search` i `firecrawl_scrape`
- jako awaryjnego ekstraktora dla `web_fetch`

Jest to hostowana usługa wyodrębniania i wyszukiwania, która obsługuje omijanie zabezpieczeń przed botami oraz buforowanie, co pomaga w przypadku witryn intensywnie korzystających z JavaScriptu lub stron blokujących zwykłe żądania HTTP.

## Instalowanie pluginu

Zainstaluj oficjalny plugin, a następnie uruchom ponownie Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## Dostęp bez klucza i klucze API

Firecrawl rejestruje dwóch dostawców `web_search`:

- **Firecrawl Search** (`firecrawl`) — korzysta z hostowanego API `/v2/search` z podanym
  kluczem; jest automatycznie wykrywany, gdy klucz jest dostępny.
- **Firecrawl Search (Free)** (`firecrawl-free`) — korzysta z hostowanego, bezpłatnego poziomu
  początkowego bez klucza; klucz API nie jest wymagany. Wymaga **jawnego włączenia**
  i nigdy nie jest wybierany automatycznie, ponieważ jego wybranie powoduje wysyłanie
  zapytań wyszukiwania do bezpłatnego poziomu usługi Firecrawl.

Jawnie wybrane rozwiązanie awaryjne Firecrawl `web_fetch` również nie wymaga klucza. Jawnie wywoływane narzędzia `firecrawl_search` i `firecrawl_scrape` wymagają klucza API. Dodaj
`FIRECRAWL_API_KEY` w środowisku Gateway lub skonfiguruj go, aby uzyskać wyższe limity.

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

- Wybranie Firecrawl podczas wdrażania lub w `openclaw configure --section web` automatycznie włącza zainstalowany plugin Firecrawl.
- Wybierz **Firecrawl Search (Free)** podczas wdrażania (lub ustaw `provider: "firecrawl-free"`), aby działać bez klucza API. Dostawca **Firecrawl Search** korzystający z klucza wysyła `plugins.entries.firecrawl.config.webSearch.apiKey` lub `FIRECRAWL_API_KEY`.
- `web_search` z Firecrawl obsługuje `query` i `count`.
- Aby korzystać z ustawień właściwych dla Firecrawl, takich jak `sources`, `categories` lub pobieranie wyników, użyj `firecrawl_search`.
- `baseUrl` domyślnie korzysta z hostowanej usługi Firecrawl pod adresem `https://api.firecrawl.dev`. Nadpisania dla samodzielnie hostowanych instancji są dozwolone tylko w przypadku prywatnych lub wewnętrznych punktów końcowych; protokół HTTP jest akceptowany wyłącznie dla takich prywatnych celów.
- `FIRECRAWL_BASE_URL` jest współdzieloną zmienną środowiskową używaną awaryjnie dla bazowych adresów URL wyszukiwania i pobierania Firecrawl.
- Domyślny limit czasu żądań wyszukiwania Firecrawl wynosi 30 sekund; parametr `timeoutSeconds` narzędzia `firecrawl_search` nadpisuje go dla poszczególnych wywołań.

## Konfigurowanie rozwiązania awaryjnego Firecrawl dla web_fetch

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // jawny wybór włącza rozwiązanie awaryjne bez klucza
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

- Jawnie wybrane rozwiązanie awaryjne Firecrawl `web_fetch` działa bez klucza API. Jeśli skonfigurowano klucz, OpenClaw wysyła `plugins.entries.firecrawl.config.webFetch.apiKey` lub `FIRECRAWL_API_KEY`, aby uzyskać wyższe limity.
- Wybranie Firecrawl podczas wdrażania lub w `openclaw configure --section web` włącza plugin i wybiera Firecrawl dla `web_fetch`, chyba że skonfigurowano już innego dostawcę pobierania.
- `firecrawl_scrape` wymaga klucza API.
- `maxAgeMs` określa maksymalny wiek wyników w pamięci podręcznej (ms). Wartość domyślna to 172,800,000 ms (2 dni).
- `onlyMainContent` ma wartość domyślną `true`; wartością domyślną `timeoutSeconds` jest 60.
- Starsza konfiguracja `tools.web.fetch.firecrawl.*` i `tools.web.search.firecrawl.*` jest automatycznie migrowana przez `openclaw doctor --fix`.
- Nadpisania adresów URL pobierania i bazowego Firecrawl podlegają tej samej regule dotyczącej usług hostowanych i prywatnych co wyszukiwanie: publiczny ruch hostowany korzysta z `https://api.firecrawl.dev`; nadpisania dla samodzielnie hostowanych instancji muszą wskazywać prywatne lub wewnętrzne punkty końcowe.
- `firecrawl_scrape` odrzuca oczywiste prywatne, zwrotne, metadanych oraz inne niż HTTP(S) docelowe adresy URL przed przekazaniem ich do Firecrawl, zgodnie z kontraktem bezpieczeństwa celów `web_fetch` dotyczącym jawnych wywołań pobierania Firecrawl.

`firecrawl_scrape` ponownie wykorzystuje te same ustawienia `plugins.entries.firecrawl.config.webFetch.*` i zmienne środowiskowe, w tym wymagany klucz API.

### Samodzielnie hostowany Firecrawl

Ustaw `plugins.entries.firecrawl.config.webSearch.baseUrl`, `plugins.entries.firecrawl.config.webFetch.baseUrl` lub `FIRECRAWL_BASE_URL`, jeśli Firecrawl działa na własnej infrastrukturze. OpenClaw akceptuje `http://` wyłącznie dla celów zwrotnych, w sieci prywatnej, `.local`, `.internal` lub `.localhost`. Niestandardowe hosty publiczne są odrzucane, aby klucze API Firecrawl nie zostały przypadkowo wysłane do dowolnych punktów końcowych.

## Narzędzia pluginu Firecrawl

### `firecrawl_search`

Użyj tego narzędzia, aby korzystać z ustawień wyszukiwania właściwych dla Firecrawl zamiast ogólnego narzędzia `web_search`. Wymaga klucza API.

Parametry:

- `query`
- `count` (1-100)
- `sources`
- `categories`
- `includeDomains` / `excludeDomains` (tylko nazwy hostów; wzajemnie się wykluczają)
- `tbs` (filtr czasu, na przykład `qdr:d`, `qdr:w`, `sbd:1`)
- `location` i `country` (kierowanie geograficzne)
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

Użyj tego narzędzia w przypadku stron intensywnie korzystających z JavaScriptu lub chronionych przed botami, dla których zwykłe narzędzie `web_fetch` jest niewystarczające.

Parametry:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Tryb stealth / omijanie zabezpieczeń przed botami

`firecrawl_scrape` i rozwiązanie awaryjne Firecrawl `web_fetch` domyślnie używają `proxy: "auto"` wraz z `storeInCache: true`, chyba że wywołujący nadpisze te parametry. `firecrawl_search` i dostawca Firecrawl `web_search` nie mają ustawień `proxy`/`storeInCache`; tryb proxy stealth ma zastosowanie wyłącznie do żądań pobierania.

Tryb `proxy` usługi Firecrawl steruje omijaniem zabezpieczeń przed botami (`basic`, `stealth` lub `auto`). `auto` ponawia próbę przy użyciu serwerów proxy stealth, jeśli podstawowa próba się nie powiedzie, co może zużyć więcej kredytów niż pobieranie wyłącznie w trybie podstawowym.

## Jak `web_fetch` korzysta z Firecrawl

Kolejność wyodrębniania `web_fetch`:

1. Readability (lokalnie)
2. Skonfigurowany dostawca pobierania, taki jak Firecrawl (gdy został wybrany lub automatycznie wykryty na podstawie skonfigurowanych danych uwierzytelniających)
3. Podstawowe oczyszczanie HTML (ostatnie rozwiązanie awaryjne)

Ustawieniem wyboru jest `tools.web.fetch.provider`. Jeśli zostanie pominięte, OpenClaw automatycznie wykrywa pierwszego gotowego dostawcę pobierania stron internetowych na podstawie dostępnych danych uwierzytelniających. Oficjalny plugin Firecrawl zapewnia to rozwiązanie awaryjne.

## Powiązane

- [Omówienie wyszukiwania w sieci](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Pobieranie z sieci](/pl/tools/web-fetch) -- narzędzie web_fetch z rozwiązaniem awaryjnym Firecrawl
- [Tavily](/pl/tools/tavily) -- narzędzia wyszukiwania i wyodrębniania
