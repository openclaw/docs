---
read_when:
    - Chcesz wyszukiwania w sieci opartego na Tavily
    - Potrzebujesz klucza API Tavily
    - Chcesz Tavily jako dostawcę `web_search`
    - Chcesz ekstrakcji treści z adresów URL
summary: Narzędzia Tavily do wyszukiwania i ekstrakcji
title: Tavily
x-i18n:
    generated_at: "2026-04-24T09:38:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9af858cd8507e3ebe6614f0695f568ce589798c816c8475685526422a048ef1a
    source_path: tools/tavily.md
    workflow: 15
---

OpenClaw może używać **Tavily** na dwa sposoby:

- jako dostawcy `web_search`
- jako jawnych narzędzi Pluginu: `tavily_search` i `tavily_extract`

Tavily to API wyszukiwania zaprojektowane dla aplikacji AI, zwracające uporządkowane wyniki
zoptymalizowane pod kątem użycia przez LLM. Obsługuje konfigurowalną głębokość wyszukiwania, filtrowanie
tematyczne, filtry domen, podsumowania odpowiedzi generowane przez AI oraz ekstrakcję treści
z adresów URL (w tym stron renderowanych przez JavaScript).

## Uzyskaj klucz API

1. Utwórz konto Tavily na [tavily.com](https://tavily.com/).
2. Wygeneruj klucz API w panelu.
3. Zapisz go w konfiguracji albo ustaw `TAVILY_API_KEY` w środowisku gateway.

## Skonfiguruj wyszukiwanie Tavily

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // opcjonalne, jeśli ustawiono TAVILY_API_KEY
            baseUrl: "https://api.tavily.com",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "tavily",
      },
    },
  },
}
```

Uwagi:

- Wybranie Tavily podczas onboardingu lub `openclaw configure --section web` automatycznie włącza
  dołączony Plugin Tavily.
- Zapisuj konfigurację Tavily pod `plugins.entries.tavily.config.webSearch.*`.
- `web_search` z Tavily obsługuje `query` i `count` (maksymalnie 20 wyników).
- Do kontrolek specyficznych dla Tavily, takich jak `search_depth`, `topic`, `include_answer`
  lub filtry domen, użyj `tavily_search`.

## Narzędzia Pluginu Tavily

### `tavily_search`

Użyj tego, gdy chcesz kontrolek wyszukiwania specyficznych dla Tavily zamiast ogólnego
`web_search`.

| Parametr | Opis |
| ----------------- | --------------------------------------------------------------------- |
| `query` | Ciąg zapytania wyszukiwania (utrzymuj poniżej 400 znaków) |
| `search_depth` | `basic` (domyślne, zrównoważone) albo `advanced` (najwyższa trafność, wolniejsze) |
| `topic` | `general` (domyślne), `news` (aktualizacje w czasie rzeczywistym) albo `finance` |
| `max_results` | Liczba wyników, 1-20 (domyślnie: 5) |
| `include_answer` | Dołącz podsumowanie odpowiedzi generowane przez AI (domyślnie: false) |
| `time_range` | Filtr według świeżości: `day`, `week`, `month` albo `year` |
| `include_domains` | Tablica domen, do których mają być ograniczone wyniki |
| `exclude_domains` | Tablica domen, które mają zostać wykluczone z wyników |

**Głębokość wyszukiwania:**

| Głębokość | Szybkość | Trafność | Najlepsze zastosowanie |
| ---------- | ------ | --------- | ----------------------------------- |
| `basic` | Szybsze | Wysoka | Zapytania ogólnego przeznaczenia (domyślne) |
| `advanced` | Wolniejsze | Najwyższa | Precyzja, konkretne fakty, badania |

### `tavily_extract`

Użyj tego do wyodrębniania czystej treści z jednego lub wielu adresów URL. Obsługuje
strony renderowane przez JavaScript i wspiera dzielenie na fragmenty ukierunkowane na zapytanie
dla celowanej ekstrakcji.

| Parametr | Opis |
| ------------------- | ---------------------------------------------------------- |
| `urls` | Tablica adresów URL do ekstrakcji (1-20 na żądanie) |
| `query` | Przereguj wyodrębnione fragmenty według trafności dla tego zapytania |
| `extract_depth` | `basic` (domyślne, szybkie) albo `advanced` (dla stron mocno opartych na JS) |
| `chunks_per_source` | Fragmenty na URL, 1-5 (wymaga `query`) |
| `include_images` | Dołącz adresy URL obrazów w wynikach (domyślnie: false) |

**Głębokość ekstrakcji:**

| Głębokość | Kiedy używać |
| ---------- | ----------------------------------------- |
| `basic` | Proste strony — najpierw spróbuj tego |
| `advanced` | SPA renderowane przez JS, treści dynamiczne, tabele |

Wskazówki:

- Maksymalnie 20 adresów URL na żądanie. Dziel większe listy na kilka wywołań.
- Użyj `query` + `chunks_per_source`, aby pobrać tylko odpowiednią treść zamiast pełnych stron.
- Najpierw spróbuj `basic`; przejdź awaryjnie do `advanced`, jeśli brakuje treści albo jest niepełna.

## Wybór właściwego narzędzia

| Potrzeba | Narzędzie |
| ------------------------------------ | ---------------- |
| Szybkie wyszukiwanie w sieci, bez specjalnych opcji | `web_search` |
| Wyszukiwanie z głębokością, tematem, odpowiedziami AI | `tavily_search` |
| Ekstrakcja treści z konkretnych adresów URL | `tavily_extract` |

## Powiązane

- [Przegląd Web Search](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Firecrawl](/pl/tools/firecrawl) -- wyszukiwanie + scraping z ekstrakcją treści
- [Exa Search](/pl/tools/exa-search) -- wyszukiwanie neuronowe z ekstrakcją treści
