---
read_when:
    - Potrzebujesz samodzielnie hostowanego dostawcy wyszukiwania w sieci
    - Chcesz używać SearXNG do web_search
    - Potrzebujesz opcji wyszukiwania nastawionej na prywatność lub odizolowanej od sieci
summary: Wyszukiwanie w sieci SearXNG -- samodzielnie hostowany dostawca metawyszukiwania niewymagający klucza
title: Wyszukiwanie SearXNG
x-i18n:
    generated_at: "2026-05-02T10:05:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9be62f7398379e1672ea7e934a571a529cac07dc5d880ac74e51f8445594034
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw obsługuje [SearXNG](https://docs.searxng.org/) jako **samodzielnie hostowanego,
bezkluczowego** dostawcę `web_search`. SearXNG to otwartoźródłowa metawyszukiwarka,
która agreguje wyniki z Google, Bing, DuckDuckGo i innych źródeł.

Zalety:

- **Bezpłatne i bez limitów** -- nie wymaga klucza API ani subskrypcji komercyjnej
- **Prywatność / izolacja sieciowa** -- zapytania nigdy nie opuszczają Twojej sieci
- **Działa wszędzie** -- bez ograniczeń regionalnych komercyjnych API wyszukiwania

## Konfiguracja

<Steps>
  <Step title="Run a SearXNG instance">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Albo użyj dowolnego istniejącego wdrożenia SearXNG, do którego masz dostęp. Zobacz
    [dokumentację SearXNG](https://docs.searxng.org/), aby skonfigurować środowisko produkcyjne.

  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    Albo ustaw zmienną środowiskową i pozwól automatycznemu wykrywaniu ją znaleźć:

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

Pole `baseUrl` akceptuje także obiekty SecretRef.

Reguły transportu:

- `https://` działa dla publicznych lub prywatnych hostów SearXNG
- `http://` jest akceptowane tylko dla zaufanych hostów w sieci prywatnej lub hostów pętli zwrotnej
- publiczne hosty SearXNG muszą używać `https://`
- hosty prywatne/wewnętrzne używają zabezpieczenia sieci samodzielnie hostowanej; publiczne hosty `https://`
  pozostają przy ścisłym zabezpieczeniu wyszukiwania w sieci i nie mogą przekierowywać na adresy prywatne

## Zmienna środowiskowa

Ustaw `SEARXNG_BASE_URL` jako alternatywę dla konfiguracji:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Gdy `SEARXNG_BASE_URL` jest ustawiona i nie skonfigurowano jawnego dostawcy, automatyczne wykrywanie
wybiera SearXNG automatycznie (z najniższym priorytetem -- każdy dostawca oparty na API z
kluczem wygrywa jako pierwszy).

## Dokumentacja konfiguracji Plugin

| Pole         | Opis                                                               |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | Bazowy URL Twojej instancji SearXNG (wymagane)                     |
| `categories` | Kategorie rozdzielone przecinkami, takie jak `general`, `news` lub `science` |
| `language`   | Kod języka wyników, taki jak `en`, `de` lub `fr`                   |

## Uwagi

- **JSON API** -- używa natywnego punktu końcowego SearXNG `format=json`, a nie scrapowania HTML
- **Adresy URL wyników obrazów** -- wyniki kategorii obrazów zawierają `img_src`, gdy SearXNG
  zwraca bezpośredni URL obrazu
- **Brak klucza API** -- działa od razu z dowolną instancją SearXNG
- **Walidacja bazowego URL** -- `baseUrl` musi być prawidłowym adresem URL `http://` lub `https://`;
  publiczne hosty muszą używać `https://`
- **Zabezpieczenie sieci** -- prywatne/wewnętrzne punkty końcowe SearXNG włączają
  dostęp do sieci prywatnej; publiczne punkty końcowe SearXNG `https://` zachowują ścisłą
  ochronę przed SSRF
- **Kolejność automatycznego wykrywania** -- SearXNG jest sprawdzany jako ostatni (kolejność 200) w
  automatycznym wykrywaniu. Dostawcy oparci na API ze skonfigurowanymi kluczami uruchamiają się jako pierwsi, następnie
  DuckDuckGo (kolejność 100), a potem Ollama Web Search (kolejność 110)
- **Samodzielnie hostowane** -- kontrolujesz instancję, zapytania i nadrzędne wyszukiwarki
- **Kategorie** domyślnie przyjmują `general`, gdy nie są skonfigurowane
- **Rezerwowa kategoria** -- jeśli żądanie kategorii innej niż `general` powiedzie się, ale
  zwróci zero wyników, OpenClaw ponawia to samo zapytanie raz z `general`
  przed zwróceniem pustego zestawu wyników

<Tip>
  Aby JSON API SearXNG działało, upewnij się, że Twoja instancja SearXNG ma włączony format `json`
  w pliku `settings.yml` w sekcji `search.formats`.
</Tip>

## Powiązane

- [Omówienie wyszukiwania w sieci](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Wyszukiwanie DuckDuckGo](/pl/tools/duckduckgo-search) -- kolejna rezerwowa opcja bez klucza
- [Brave Search](/pl/tools/brave-search) -- ustrukturyzowane wyniki z bezpłatnym poziomem
