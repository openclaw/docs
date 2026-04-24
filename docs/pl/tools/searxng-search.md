---
read_when:
    - Chcesz self-hosted provider wyszukiwania w sieci
    - Chcesz używać SearXNG do `web_search`
    - Potrzebujesz opcji wyszukiwania skupionej na prywatności lub air-gapped
summary: Wyszukiwanie w sieci SearXNG -- self-hosted provider meta-search bez klucza
title: Wyszukiwanie SearXNG
x-i18n:
    generated_at: "2026-04-24T09:37:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: a07198ef7a6f363b9e5e78e57e6e31f193f8f10882945208191c8baea5fe67d6
    source_path: tools/searxng-search.md
    workflow: 15
---

OpenClaw obsługuje [SearXNG](https://docs.searxng.org/) jako **self-hosted,
bezkluczowego** providera `web_search`. SearXNG to open-source’owy silnik
meta-search, który agreguje wyniki z Google, Bing, DuckDuckGo i innych źródeł.

Zalety:

- **Darmowe i bez limitów** -- nie wymaga klucza API ani komercyjnej subskrypcji
- **Prywatność / air-gap** -- zapytania nigdy nie opuszczają Twojej sieci
- **Działa wszędzie** -- brak ograniczeń regionalnych komercyjnych API wyszukiwania

## Konfiguracja

<Steps>
  <Step title="Uruchom instancję SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Albo użyj dowolnego istniejącego wdrożenia SearXNG, do którego masz dostęp. Zobacz
    [dokumentację SearXNG](https://docs.searxng.org/), aby poznać konfigurację produkcyjną.

  </Step>
  <Step title="Skonfiguruj">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    Albo ustaw zmienną środowiskową i pozwól automatycznemu wykrywaniu ją odnaleźć:

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

Ustawienia na poziomie Pluginu dla instancji SearXNG:

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

- `https://` działa dla publicznych i prywatnych hostów SearXNG
- `http://` jest akceptowane tylko dla zaufanych hostów w sieci prywatnej lub local loopback
- publiczne hosty SearXNG muszą używać `https://`

## Zmienna środowiskowa

Ustaw `SEARXNG_BASE_URL` jako alternatywę dla konfiguracji:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Gdy ustawiono `SEARXNG_BASE_URL` i nie skonfigurowano jawnie providera, automatyczne wykrywanie
wybiera SearXNG automatycznie (z najniższym priorytetem -- każdy provider oparty na API z
kluczem wygrywa najpierw).

## Dokumentacja konfiguracji Pluginu

| Pole         | Opis                                                                 |
| ------------ | -------------------------------------------------------------------- |
| `baseUrl`    | Bazowy URL Twojej instancji SearXNG (wymagane)                       |
| `categories` | Kategorie rozdzielane przecinkami, takie jak `general`, `news` lub `science` |
| `language`   | Kod języka wyników, taki jak `en`, `de` lub `fr`                     |

## Uwagi

- **JSON API** -- używa natywnego endpointu `format=json` SearXNG, a nie scrapowania HTML
- **Brak klucza API** -- działa od razu z dowolną instancją SearXNG
- **Walidacja bazowego URL-a** -- `baseUrl` musi być prawidłowym URL-em `http://` lub `https://`;
  publiczne hosty muszą używać `https://`
- **Kolejność automatycznego wykrywania** -- SearXNG jest sprawdzane na końcu (kolejność 200) w
  automatycznym wykrywaniu. Providerzy oparci na API ze skonfigurowanymi kluczami uruchamiani są najpierw, potem
  DuckDuckGo (kolejność 100), a następnie Ollama Web Search (kolejność 110)
- **Self-hosted** -- kontrolujesz instancję, zapytania i nadrzędne silniki wyszukiwania
- **Categories** domyślnie przyjmuje wartość `general`, jeśli nie skonfigurowano inaczej

<Tip>
  Aby JSON API SearXNG działało, upewnij się, że Twoja instancja SearXNG ma włączony format `json`
  w `settings.yml` w sekcji `search.formats`.
</Tip>

## Powiązane

- [Przegląd Web Search](/pl/tools/web) -- wszyscy providerzy i automatyczne wykrywanie
- [DuckDuckGo Search](/pl/tools/duckduckgo-search) -- kolejny fallback bez klucza
- [Brave Search](/pl/tools/brave-search) -- uporządkowane wyniki z darmowym poziomem usage
