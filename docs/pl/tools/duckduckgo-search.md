---
read_when:
    - Chcesz dostawcę wyszukiwania w sieci, który nie wymaga klucza API
    - Chcesz używać DuckDuckGo do web_search
    - Potrzebujesz zapasowego mechanizmu wyszukiwania niewymagającego konfiguracji
summary: Wyszukiwarka internetowa DuckDuckGo -- zapasowy dostawca niewymagający klucza (eksperymentalny, oparty na HTML)
title: Wyszukiwanie DuckDuckGo
x-i18n:
    generated_at: "2026-05-06T09:32:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89c23535730dc272b88e22d1dbeef61abd55a7968d9e57bdce20594df8a2c0f2
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw obsługuje DuckDuckGo jako dostawcę `web_search` **bez klucza**. Nie jest wymagany klucz API ani konto.

<Warning>
  DuckDuckGo to **eksperymentalna, nieoficjalna** integracja, która pobiera wyniki
  ze stron wyszukiwania DuckDuckGo bez JavaScriptu - nie z oficjalnego API. Należy
  spodziewać się sporadycznych awarii z powodu stron z wyzwaniami dla botów lub zmian HTML.
</Warning>

## Konfiguracja

Nie potrzeba klucza API - wystarczy ustawić DuckDuckGo jako dostawcę:

<Steps>
  <Step title="Skonfiguruj">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
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

Opcjonalne ustawienia na poziomie Plugin dla regionu i SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
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
Liczba wyników do zwrócenia (1-10).
</ParamField>

<ParamField path="region" type="string">
Kod regionu DuckDuckGo (np. `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Poziom SafeSearch.
</ParamField>

Region i SafeSearch można też ustawić w konfiguracji Plugin (patrz wyżej) - parametry
narzędzia zastępują wartości konfiguracji dla pojedynczego zapytania.

## Uwagi

- **Brak klucza API** - działa od razu, bez konfiguracji
- **Eksperymentalne** - zbiera wyniki ze stron wyszukiwania DuckDuckGo w formacie HTML
  bez JavaScriptu, a nie z oficjalnego API ani SDK
- **Ryzyko wyzwań dla botów** - DuckDuckGo może wyświetlać CAPTCHA lub blokować żądania
  przy intensywnym albo zautomatyzowanym użyciu
- **Parsowanie HTML** - wyniki zależą od struktury strony, która może się zmienić bez
  powiadomienia
- **Kolejność automatycznego wykrywania** - DuckDuckGo jest pierwszą zapasową opcją bez klucza
  (kolejność 100) w automatycznym wykrywaniu. Dostawcy oparci na API ze skonfigurowanymi kluczami są uruchamiani
  jako pierwsi, potem Ollama Web Search (kolejność 110), następnie SearXNG (kolejność 200)
- **SafeSearch domyślnie ma poziom moderate**, gdy nie jest skonfigurowany

<Tip>
  Do zastosowań produkcyjnych rozważ [Brave Search](/pl/tools/brave-search) (dostępny darmowy poziom)
  albo innego dostawcę opartego na API.
</Tip>

## Powiązane

- [Omówienie Web Search](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Brave Search](/pl/tools/brave-search) -- uporządkowane wyniki z darmowym poziomem
- [Exa Search](/pl/tools/exa-search) -- wyszukiwanie neuronowe z wyodrębnianiem treści
