---
read_when:
    - Chcesz samodzielnie hostowanego dostawcy wyszukiwania w sieci
    - Chcesz używać SearXNG do web_search
    - Potrzebujesz opcji wyszukiwania skoncentrowanej na prywatności lub odizolowanej od sieci
summary: Wyszukiwanie internetowe SearXNG -- samodzielnie hostowany dostawca metawyszukiwarki bez klucza
title: Wyszukiwanie SearXNG
x-i18n:
    generated_at: "2026-06-27T18:30:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4bd00a20e45f71b7bd855a6588d5c829a0202839fc93ddcec1e255b7858ff183
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw obsługuje [SearXNG](https://docs.searxng.org/) jako **samodzielnie hostowanego,
bezkluczowego** dostawcę `web_search`. SearXNG to otwartoźródłowa metawyszukiwarka,
która agreguje wyniki z Google, Bing, DuckDuckGo i innych źródeł.

Zalety:

- **Bezpłatna i bez limitów** -- nie wymaga klucza API ani komercyjnej subskrypcji
- **Prywatność / air-gap** -- zapytania nigdy nie opuszczają Twojej sieci
- **Działa wszędzie** -- brak ograniczeń regionalnych komercyjnych API wyszukiwania

## Konfiguracja

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="Run a SearXNG instance">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Albo użyj dowolnego istniejącego wdrożenia SearXNG, do którego masz dostęp. Zobacz
    [dokumentację SearXNG](https://docs.searxng.org/) dotyczącą konfiguracji produkcyjnej.

  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    Albo ustaw zmienną środowiskową i pozwól, aby automatyczne wykrywanie ją znalazło:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## Konfiguracja

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

Ustawienia na poziomie Plugin dla instancji SearXNG:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

Pole `baseUrl` akceptuje również obiekty SecretRef.

Reguły transportu:

- `https://` działa dla publicznych lub prywatnych hostów SearXNG
- `http://` jest akceptowane tylko dla zaufanych hostów w sieci prywatnej lub hostów loopback
- publiczne hosty SearXNG muszą używać `https://`
- hosty prywatne/wewnętrzne używają strażnika sieci samodzielnie hostowanej; publiczne hosty `https://`
  pozostają objęte ścisłym strażnikiem wyszukiwania w sieci i nie mogą przekierowywać na adresy
  prywatne

## Zmienna środowiskowa

Ustaw `SEARXNG_BASE_URL` jako alternatywę dla konfiguracji:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Gdy `SEARXNG_BASE_URL` jest ustawiona i nie skonfigurowano jawnego dostawcy, automatyczne wykrywanie
automatycznie wybiera SearXNG (z najniższym priorytetem -- każdy dostawca oparty na API z
kluczem wygrywa jako pierwszy).

## Dokumentacja konfiguracji Plugin

| Pole         | Opis                                                                |
| ------------ | ------------------------------------------------------------------- |
| `baseUrl`    | Bazowy URL Twojej instancji SearXNG (wymagane)                      |
| `categories` | Kategorie rozdzielone przecinkami, takie jak `general`, `news` lub `science` |
| `language`   | Kod języka wyników, taki jak `en`, `de` lub `fr`                    |

## Uwagi

- **API JSON** -- używa natywnego punktu końcowego SearXNG `format=json`, a nie scrapowania HTML
- **Adresy URL wyników obrazów** -- wyniki z kategorii obrazów zawierają `img_src`, gdy SearXNG
  zwraca bezpośredni adres URL obrazu
- **Brak klucza API** -- działa od razu z dowolną instancją SearXNG
- **Walidacja bazowego URL** -- `baseUrl` musi być prawidłowym adresem URL `http://` lub `https://`;
  hosty publiczne muszą używać `https://`
- **Strażnik sieci** -- prywatne/wewnętrzne punkty końcowe SearXNG jawnie włączają
  dostęp do sieci prywatnej; publiczne punkty końcowe SearXNG `https://` zachowują ścisłą
  ochronę SSRF
- **Kolejność automatycznego wykrywania** -- SearXNG jest sprawdzany po dostawcach opartych na API
  ze skonfigurowanymi kluczami (kolejność 200). Dostawcy bez klucza, tacy jak DuckDuckGo lub
  Ollama Web Search, nie są automatycznie wybierani bez jawnego wyboru dostawcy
- **Samodzielnie hostowane** -- kontrolujesz instancję, zapytania i nadrzędne wyszukiwarki
- **Kategorie** domyślnie mają wartość `general`, gdy nie są skonfigurowane
- **Awaryjna kategoria** -- jeśli żądanie kategorii innej niż `general` powiedzie się, ale
  zwróci zero wyników, OpenClaw ponawia to samo zapytanie raz z `general`
  przed zwróceniem pustego zestawu wyników

<Tip>
  Aby API JSON SearXNG działało, upewnij się, że Twoja instancja SearXNG ma włączony format `json`
  w pliku `settings.yml` pod `search.formats`.
</Tip>

## Powiązane

- [Omówienie wyszukiwania w sieci](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [DuckDuckGo Search](/pl/tools/duckduckgo-search) -- kolejny dostawca bez klucza
- [Brave Search](/pl/tools/brave-search) -- uporządkowane wyniki z bezpłatnym poziomem
