---
read_when:
    - Chcesz dostawcę wyszukiwania w sieci, który nie wymaga klucza API
    - Chcesz używać DuckDuckGo dla `web_search`
    - Potrzebujesz awaryjnego wyszukiwania bez konfiguracji
summary: Wyszukiwanie DuckDuckGo -- zapasowy dostawca bez klucza (eksperymentalny, oparty na HTML)
title: Wyszukiwanie DuckDuckGo
x-i18n:
    generated_at: "2026-04-05T14:07:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31f8e3883584534396c247c3d8069ea4c5b6399e0ff13a9dd0c8ee0c3da02096
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

# Wyszukiwanie DuckDuckGo

OpenClaw obsługuje DuckDuckGo jako dostawcę `web_search` **bez klucza**. Nie jest wymagany
żaden klucz API ani konto.

<Warning>
  DuckDuckGo to **eksperymentalna, nieoficjalna** integracja, która pobiera wyniki
  z wyszukiwarek DuckDuckGo bez JavaScriptu — a nie z oficjalnego API. Należy
  oczekiwać sporadycznych problemów spowodowanych stronami z wyzwaniami dla botów lub zmianami HTML.
</Warning>

## Konfiguracja

Nie jest potrzebny klucz API — po prostu ustaw DuckDuckGo jako dostawcę:

<Steps>
  <Step title="Skonfiguruj">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## Config

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

Opcjonalne ustawienia na poziomie wtyczki dla regionu i SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // Kod regionu DuckDuckGo
            safeSearch: "moderate", // "strict", "moderate" lub "off"
          },
        },
      },
    },
  },
}
```

## Parametry narzędzia

| Parametr     | Opis                                                         |
| ------------ | ------------------------------------------------------------ |
| `query`      | Zapytanie wyszukiwania (wymagane)                            |
| `count`      | Liczba wyników do zwrócenia (1-10, domyślnie: 5)             |
| `region`     | Kod regionu DuckDuckGo (np. `us-en`, `uk-en`, `de-de`)       |
| `safeSearch` | Poziom SafeSearch: `strict`, `moderate` (domyślnie) lub `off` |

Region i SafeSearch można również ustawić w konfiguracji wtyczki (patrz wyżej) — parametry
narzędzia nadpisują wartości konfiguracji dla pojedynczego zapytania.

## Uwagi

- **Bez klucza API** — działa od razu, bez konfiguracji
- **Eksperymentalne** — zbiera wyniki ze stron wyszukiwania HTML DuckDuckGo bez JavaScriptu,
  a nie z oficjalnego API ani SDK
- **Ryzyko wyzwań dla botów** — DuckDuckGo może wyświetlać CAPTCHA lub blokować żądania
  przy intensywnym lub zautomatyzowanym użyciu
- **Parsowanie HTML** — wyniki zależą od struktury strony, która może się zmienić bez
  ostrzeżenia
- **Kolejność automatycznego wykrywania** — DuckDuckGo to pierwszy zapasowy dostawca bez klucza
  (kolejność 100) w automatycznym wykrywaniu. Najpierw uruchamiani są dostawcy oparci na API ze
  skonfigurowanymi kluczami, potem Ollama Web Search (kolejność 110), a następnie SearXNG (kolejność 200)
- **SafeSearch domyślnie ma wartość moderate**, gdy nie jest skonfigurowane

<Tip>
  Do zastosowań produkcyjnych rozważ [Brave Search](/tools/brave-search) (dostępna
  darmowa warstwa) lub innego dostawcę opartego na API.
</Tip>

## Powiązane

- [Przegląd Web Search](/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Brave Search](/tools/brave-search) -- uporządkowane wyniki z darmową warstwą
- [Exa Search](/tools/exa-search) -- wyszukiwanie neuronowe z ekstrakcją treści
