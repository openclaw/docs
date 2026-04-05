---
read_when:
    - Chcesz samodzielnie hostowanego dostawcy web search
    - Chcesz używać SearXNG dla web_search
    - Potrzebujesz opcji wyszukiwania z naciskiem na prywatność lub dla środowisk air-gapped
summary: Wyszukiwanie SearXNG -- samodzielnie hostowany dostawca meta-wyszukiwania bez kluczy
title: Wyszukiwanie SearXNG
x-i18n:
    generated_at: "2026-04-05T14:09:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a8fc7f890b7595d17c5ef8aede9b84bb2459f30a53d5d87c4e7423e1ac83ca5
    source_path: tools/searxng-search.md
    workflow: 15
---

# Wyszukiwanie SearXNG

OpenClaw obsługuje [SearXNG](https://docs.searxng.org/) jako **samodzielnie hostowanego,
bezkluczowego** dostawcę `web_search`. SearXNG to silnik meta-wyszukiwania open source,
który agreguje wyniki z Google, Bing, DuckDuckGo i innych źródeł.

Zalety:

- **Darmowe i bez limitu** -- nie wymaga klucza API ani komercyjnej subskrypcji
- **Prywatność / air-gap** -- zapytania nigdy nie opuszczają Twojej sieci
- **Działa wszędzie** -- brak ograniczeń regionalnych komercyjnych API wyszukiwania

## Konfiguracja

<Steps>
  <Step title="Uruchom instancję SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Możesz też użyć dowolnego istniejącego wdrożenia SearXNG, do którego masz dostęp. Zobacz
    [dokumentację SearXNG](https://docs.searxng.org/), aby poznać konfigurację produkcyjną.

  </Step>
  <Step title="Skonfiguruj">
    ```bash
    openclaw configure --section web
    # Wybierz "searxng" jako dostawcę
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

Ustawienia na poziomie pluginu dla instancji SearXNG:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // opcjonalne
            language: "en", // opcjonalne
          },
        },
      },
    },
  },
}
```

Pole `baseUrl` akceptuje również obiekty SecretRef.

Zasady transportu:

- `https://` działa dla publicznych lub prywatnych hostów SearXNG
- `http://` jest akceptowane tylko dla zaufanych hostów prywatnej sieci albo loopback
- publiczne hosty SearXNG muszą używać `https://`

## Zmienna środowiskowa

Ustaw `SEARXNG_BASE_URL` jako alternatywę dla konfiguracji:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Gdy `SEARXNG_BASE_URL` jest ustawione i nie skonfigurowano jawnie dostawcy, automatyczne wykrywanie
wybiera SearXNG automatycznie (z najniższym priorytetem -- każdy dostawca oparty na API z
kluczem wygrywa wcześniej).

## Dokumentacja konfiguracji pluginu

| Pole         | Opis                                                                  |
| ------------ | --------------------------------------------------------------------- |
| `baseUrl`    | Bazowy URL instancji SearXNG (wymagane)                               |
| `categories` | Kategorie rozdzielone przecinkami, takie jak `general`, `news` lub `science` |
| `language`   | Kod języka wyników, taki jak `en`, `de` lub `fr`                      |

## Uwagi

- **JSON API** -- używa natywnego endpointu `format=json` SearXNG, a nie scrapowania HTML
- **Brak klucza API** -- działa od razu z każdą instancją SearXNG
- **Walidacja base URL** -- `baseUrl` musi być prawidłowym adresem URL `http://` lub `https://`;
  hosty publiczne muszą używać `https://`
- **Kolejność automatycznego wykrywania** -- SearXNG jest sprawdzane jako ostatnie (kolejność 200) w
  automatycznym wykrywaniu. Najpierw uruchamiani są dostawcy oparci na API ze skonfigurowanymi kluczami,
  następnie DuckDuckGo (kolejność 100), a potem Ollama Web Search (kolejność 110)
- **Samodzielnie hostowane** -- kontrolujesz instancję, zapytania i upstreamowe wyszukiwarki
- **Categories** domyślnie mają wartość `general`, jeśli nie są skonfigurowane

<Tip>
  Aby JSON API SearXNG działało, upewnij się, że w instancji SearXNG format `json`
  jest włączony w `settings.yml` pod `search.formats`.
</Tip>

## Powiązane

- [Przegląd Web Search](/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Wyszukiwanie DuckDuckGo](/tools/duckduckgo-search) -- kolejny fallback bez klucza
- [Wyszukiwanie Brave](/tools/brave-search) -- uporządkowane wyniki z darmowym tierem
