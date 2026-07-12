---
read_when:
    - Chcesz używać Kimi do wyszukiwania w internecie
    - Potrzebujesz `KIMI_API_KEY` lub `MOONSHOT_API_KEY`
summary: Wyszukiwanie internetowe Kimi przez wyszukiwarkę internetową Moonshot
title: Wyszukiwanie Kimi
x-i18n:
    generated_at: "2026-07-12T15:45:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi to dostawca `web_search` korzystający z natywnego wyszukiwania internetowego Moonshot. Moonshot
tworzy jedną odpowiedź z cytowaniami w tekście, podobnie jak dostawcy odpowiedzi
opartych na źródłach Gemini i Grok, zamiast zwracać uporządkowaną listę wyników.

## Konfiguracja

<Steps>
  <Step title="Utwórz klucz">
    Uzyskaj klucz API w [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Zapisz klucz">
    Ustaw `KIMI_API_KEY` lub `MOONSHOT_API_KEY` w środowisku Gateway (w przypadku
    instalacji Gateway dodaj go do `~/.openclaw/.env`) albo skonfiguruj za pomocą:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Wybranie opcji **Kimi** podczas działania `openclaw onboard` lub `openclaw configure --section web`
powoduje również wyświetlenie monitów o:

- region API Moonshot: `https://api.moonshot.ai/v1` lub `https://api.moonshot.cn/v1`
- model wyszukiwania internetowego (domyślnie `kimi-k2.6`)

## Konfiguracja

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // opcjonalne, jeśli ustawiono KIMI_API_KEY lub MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

Jeśli pominięto `tools.web.search.provider`, jest on automatycznie wykrywany na podstawie
dostępnych kluczy API; ustaw go jawnie na `kimi`, jeśli skonfigurowano dane
uwierzytelniające dla wielu usług wyszukiwania.

Działa również równoważna postać o ograniczonym zakresie w `tools.web.search.kimi`
(`apiKey`, `baseUrl`, `model`); obie postacie są scalane w tę samą wynikową konfigurację.

Wartości domyślne: jeśli pominięto `baseUrl`, jego wartością domyślną jest
`https://api.moonshot.ai/v1`, a wartością domyślną `model` jest `kimi-k2.6`.

Jeśli ruch czatu korzysta z chińskiego hosta (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), wyszukiwanie Kimi `web_search` automatycznie używa tego samego
hosta, gdy jego własne `baseUrl` nie jest ustawione, dzięki czemu klucze `.cn` nie trafiają
przypadkowo do międzynarodowego punktu końcowego (który zwraca dla nich HTTP 401). Ustaw jawne
`baseUrl` Kimi, aby zastąpić to dziedziczenie.

## Wymaganie oparcia na źródłach

OpenClaw zwraca wynik `web_search` Kimi dopiero wtedy, gdy odpowiedź Moonshot
zawiera natywne dowody oparcia wyszukiwania internetowego na źródłach, takie jak
odtworzenie wywołania narzędzia `$web_search`, `search_results` lub adresy URL cytowań.
Jeśli Kimi odpowie bezpośrednio bez oparcia na źródłach (na przykład „Nie mogę przeglądać
internetu”), OpenClaw zwraca błąd `kimi_web_search_ungrounded`, zamiast traktować ten tekst
jako wynik wyszukiwania. Ponów zapytanie, przełącz się na dostawcę zwracającego dane
ustrukturyzowane, takiego jak Brave, albo użyj `web_fetch` lub narzędzia przeglądarki,
jeśli masz już docelowy adres URL.

## Parametry narzędzia

| Parametr                                                        | Obsługa                                                                                                                       |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `query`                                                         | Tak                                                                                                                           |
| `count`                                                         | Akceptowany w celu zgodności między dostawcami, ale ignorowany: Kimi zawsze zwraca jedną zsyntetyzowaną odpowiedź, a nie listę N wyników |
| `country`, `language`, `freshness`, `date_after`, `date_before` | Nie                                                                                                                           |

## Powiązane materiały

- [Omówienie wyszukiwania internetowego](/pl/tools/web) — wszyscy dostawcy i automatyczne wykrywanie
- [Moonshot AI](/pl/providers/moonshot) — dokumentacja modelu Moonshot i dostawcy Kimi Coding
- [Wyszukiwanie Gemini](/pl/tools/gemini-search) — odpowiedzi syntetyzowane przez AI na podstawie źródeł Google
- [Wyszukiwanie Grok](/pl/tools/grok-search) — odpowiedzi syntetyzowane przez AI na podstawie źródeł xAI
