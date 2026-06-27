---
read_when:
    - Potrzebujesz dostawcy wyszukiwania w sieci, który nie wymaga klucza API
    - Chcesz użyć DuckDuckGo do web_search
    - Chcesz jawnie wybranego dostawcy wyszukiwania bez klucza
summary: Wyszukiwanie internetowe DuckDuckGo -- dostawca bez klucza (eksperymentalny, oparty na HTML)
title: Wyszukiwanie DuckDuckGo
x-i18n:
    generated_at: "2026-06-27T18:25:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c042a3cd4fa6f37cb42b88930b5fe0122a561a810e275f26d9c1eb56502495a7
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw obsługuje DuckDuckGo jako dostawcę `web_search` **bez klucza**. Klucz API
ani konto nie są wymagane.

<Warning>
  DuckDuckGo to **eksperymentalna, nieoficjalna** integracja, która pobiera wyniki
  ze stron wyszukiwania DuckDuckGo bez JavaScriptu - nie z oficjalnego API. Spodziewaj się
  sporadycznych awarii przez strony z wyzwaniami dla botów lub zmiany HTML.
</Warning>

## Konfiguracja

Klucz API nie jest potrzebny - po prostu ustaw DuckDuckGo jako swojego dostawcę:

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

Opcjonalne ustawienia na poziomie pluginu dla regionu i SafeSearch:

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

Region i SafeSearch można też ustawić w konfiguracji pluginu (patrz wyżej) - parametry
narzędzia zastępują wartości konfiguracji dla danego zapytania.

## Uwagi

- **Brak klucza API** - działa po wybraniu DuckDuckGo jako dostawcy `web_search`
- **Eksperymentalne** - zbiera wyniki ze stron wyszukiwania HTML DuckDuckGo bez JavaScriptu,
  a nie z oficjalnego API ani SDK
- **Ryzyko wyzwań dla botów** - DuckDuckGo może wyświetlać CAPTCHA lub blokować żądania
  przy intensywnym albo zautomatyzowanym użyciu
- **Parsowanie HTML** - wyniki zależą od struktury strony, która może zmienić się bez
  powiadomienia
- **Jawny wybór** - OpenClaw nie wybiera DuckDuckGo automatycznie,
  gdy nie skonfigurowano dostawcy opartego na API
- **SafeSearch domyślnie ma poziom moderate**, gdy nie jest skonfigurowane

<Tip>
  Do użytku produkcyjnego rozważ [Brave Search](/pl/tools/brave-search) (dostępny
  bezpłatny poziom) albo innego dostawcę opartego na API.
</Tip>

## Powiązane

- [Omówienie Web Search](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Brave Search](/pl/tools/brave-search) -- uporządkowane wyniki z bezpłatnym poziomem
- [Exa Search](/pl/tools/exa-search) -- wyszukiwanie neuronowe z wyodrębnianiem treści
