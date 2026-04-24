---
read_when:
    - Chcesz dostawcę wyszukiwania w sieci, który nie wymaga klucza API
    - Chcesz używać DuckDuckGo do `web_search`
    - Potrzebujesz zapasowego wyszukiwania bez konfiguracji
summary: Wyszukiwanie w sieci DuckDuckGo — zapasowy dostawca bez klucza (eksperymentalny, oparty na HTML)
title: Wyszukiwanie DuckDuckGo
x-i18n:
    generated_at: "2026-04-24T09:35:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6828830079b0bee1321f0971ec120ae98bc72ab040ad3a0fe30fe89217ed0722
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

OpenClaw obsługuje DuckDuckGo jako dostawcę `web_search` **bez klucza**. Klucz API ani konto nie są wymagane.

<Warning>
  DuckDuckGo to **eksperymentalna, nieoficjalna** integracja, która pobiera wyniki
  ze stron wyszukiwania DuckDuckGo bez JavaScriptu — nie z oficjalnego API. Możliwe są
  sporadyczne awarie z powodu stron z wyzwaniami antybotowymi lub zmian w HTML.
</Warning>

## Konfiguracja

Klucz API nie jest potrzebny — wystarczy ustawić DuckDuckGo jako dostawcę:

<Steps>
  <Step title="Konfiguracja">
    ```bash
    openclaw configure --section web
    # Wybierz "duckduckgo" jako dostawcę
    ```
  </Step>
</Steps>

## Konfiguracja

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

Opcjonalne ustawienia na poziomie Pluginu dla regionu i SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // kod regionu DuckDuckGo
            safeSearch: "moderate", // "strict", "moderate" lub "off"
          },
        },
      },
    },
  },
}
```

## Parametry narzędzia

<ParamField path="query" type="string" required>
Zapytanie wyszukiwania.
</ParamField>

<ParamField path="count" type="number" default="5">
Liczba wyników do zwrócenia (1–10).
</ParamField>

<ParamField path="region" type="string">
Kod regionu DuckDuckGo (np. `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Poziom SafeSearch.
</ParamField>

Region i SafeSearch można również ustawić w konfiguracji Pluginu (patrz wyżej) — parametry
narzędzia nadpisują wartości konfiguracyjne dla każdego zapytania.

## Uwagi

- **Brak klucza API** — działa od razu, bez żadnej konfiguracji
- **Eksperymentalne** — zbiera wyniki ze stron wyszukiwania HTML DuckDuckGo bez JavaScriptu,
  a nie z oficjalnego API ani SDK
- **Ryzyko wyzwań antybotowych** — DuckDuckGo może wyświetlać CAPTCHA lub blokować żądania
  przy intensywnym albo zautomatyzowanym użyciu
- **Parsowanie HTML** — wyniki zależą od struktury strony, która może zmienić się bez
  uprzedzenia
- **Kolejność automatycznego wykrywania** — DuckDuckGo jest pierwszym zapasowym rozwiązaniem bez klucza
  (kolejność 100) w automatycznym wykrywaniu. Dostawcy opierający się na API ze skonfigurowanymi kluczami są uruchamiani
  najpierw, potem Ollama Web Search (kolejność 110), a następnie SearXNG (kolejność 200)
- **SafeSearch domyślnie ma wartość moderate**, gdy nie jest skonfigurowany

<Tip>
  Do zastosowań produkcyjnych rozważ [Brave Search](/pl/tools/brave-search) (dostępny
  darmowy plan) lub innego dostawcę opartego na API.
</Tip>

## Powiązane

- [Przegląd Web Search](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Brave Search](/pl/tools/brave-search) -- uporządkowane wyniki z darmowym planem
- [Exa Search](/pl/tools/exa-search) -- wyszukiwanie neuronowe z ekstrakcją treści
