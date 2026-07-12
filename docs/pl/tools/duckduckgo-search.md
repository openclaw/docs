---
read_when:
    - Potrzebujesz dostawcy wyszukiwania internetowego, który nie wymaga klucza API
    - Chcesz używać DuckDuckGo do wyszukiwania w internecie
    - Chcesz jawnie wybrać dostawcę wyszukiwania niewymagającego klucza
summary: Wyszukiwanie internetowe DuckDuckGo — dostawca niewymagający klucza (eksperymentalny, oparty na HTML)
title: Wyszukiwanie w DuckDuckGo
x-i18n:
    generated_at: "2026-07-12T15:44:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84e90532de276dcb3f73c67015dffe5f5a62be673e44a19053b2b1dfcb0986ac
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw obsługuje DuckDuckGo jako dostawcę `web_search` **niewymagającego klucza**. Nie jest wymagany klucz API ani konto.

<Warning>
  DuckDuckGo to **eksperymentalna, nieoficjalna** integracja, która pobiera dane ze stron wyników wyszukiwania DuckDuckGo w formacie HTML bez JavaScriptu — nie korzysta z oficjalnego API. Należy liczyć się ze sporadycznymi awariami spowodowanymi stronami weryfikacji antybotowej lub zmianami w kodzie HTML.
</Warning>

## Konfiguracja

DuckDuckGo nigdy nie jest wybierany automatycznie, ponieważ automatyczne wykrywanie uwzględnia tylko dostawców z działającymi danymi uwierzytelniającymi. Ustaw go jawnie:

<Steps>
  <Step title="Skonfiguruj">
    ```bash
    openclaw configure --section web
    # Wybierz „duckduckgo” jako dostawcę
    ```
  </Step>
</Steps>

## Konfiguracja w pliku

Ustaw dostawcę bezpośrednio w konfiguracji:

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

Opcjonalne ustawienia regionu i filtra SafeSearch na poziomie pluginu:

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

<ParamField path="query" type="string" required>
Zapytanie wyszukiwania.
</ParamField>

<ParamField path="count" type="number" default="5">
Liczba zwracanych wyników (1–10).
</ParamField>

<ParamField path="region" type="string">
Kod regionu DuckDuckGo (np. `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Poziom filtra SafeSearch.
</ParamField>

Parametry narzędzia `region` i `safeSearch` zastępują powyższe wartości konfiguracji pluginu dla poszczególnych zapytań.

## Uwagi

- **Bez klucza API** — działa po wybraniu DuckDuckGo jako dostawcy `web_search`.
- **Eksperymentalne** — pobiera dane ze stron wyników wyszukiwania DuckDuckGo w formacie HTML bez JavaScriptu, a nie z oficjalnego API ani zestawu SDK. Wyniki zależą od struktury strony, która może ulec zmianie bez powiadomienia.
- **Ryzyko weryfikacji antybotowej** — DuckDuckGo może wyświetlać testy CAPTCHA lub blokować żądania przy intensywnym bądź zautomatyzowanym użyciu.
- **Tylko jawny wybór** — automatyczne wykrywanie OpenClaw uwzględnia tylko dostawców z działającymi danymi uwierzytelniającymi, dlatego dostawca niewymagający klucza, taki jak DuckDuckGo, nigdy nie jest wybierany automatycznie; musisz ustawić `provider: "duckduckgo"`.
- **Domyślna wartość SafeSearch to `moderate`**, jeśli nie została skonfigurowana.

<Tip>
  Do zastosowań produkcyjnych rozważ usługę [Brave Search](/pl/tools/brave-search) (dostępny plan bezpłatny) lub innego dostawcę opartego na API.
</Tip>

## Powiązane materiały

- [Omówienie wyszukiwania w sieci](/pl/tools/web) — wszyscy dostawcy i automatyczne wykrywanie
- [Brave Search](/pl/tools/brave-search) — ustrukturyzowane wyniki z planem bezpłatnym
- [Exa Search](/pl/tools/exa-search) — wyszukiwanie neuronowe z wyodrębnianiem treści
