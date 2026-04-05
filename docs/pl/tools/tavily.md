---
read_when:
    - Chcesz wyszukiwania w sieci opartego na Tavily
    - Potrzebujesz klucza API Tavily
    - Chcesz używać Tavily jako dostawcy `web_search`
    - Chcesz ekstrakcji treści z adresów URL
summary: Narzędzia wyszukiwania i ekstrakcji Tavily
title: Tavily
x-i18n:
    generated_at: "2026-04-05T14:09:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: db530cc101dc930611e4ca54e3d5972140f116bfe168adc939dc5752322d205e
    source_path: tools/tavily.md
    workflow: 15
---

# Tavily

OpenClaw może używać **Tavily** na dwa sposoby:

- jako dostawcy `web_search`
- jako jawnych narzędzi pluginu: `tavily_search` i `tavily_extract`

Tavily to API wyszukiwania zaprojektowane dla aplikacji AI, zwracające uporządkowane wyniki
zoptymalizowane do wykorzystania przez LLM. Obsługuje konfigurowalną głębokość wyszukiwania, filtrowanie
według tematów, filtry domen, generowane przez AI podsumowania odpowiedzi oraz ekstrakcję treści
z adresów URL (w tym stron renderowanych przez JavaScript).

## Uzyskaj klucz API

1. Utwórz konto Tavily na [tavily.com](https://tavily.com/).
2. Wygeneruj klucz API w panelu.
3. Zapisz go w konfiguracji lub ustaw `TAVILY_API_KEY` w środowisku gateway.

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

- Wybranie Tavily podczas onboardingu lub przez `openclaw configure --section web` automatycznie włącza
  bundled plugin Tavily.
- Przechowuj konfigurację Tavily w `plugins.entries.tavily.config.webSearch.*`.
- `web_search` z Tavily obsługuje `query` i `count` (do 20 wyników).
- W przypadku ustawień specyficznych dla Tavily, takich jak `search_depth`, `topic`, `include_answer`
  lub filtry domen, użyj `tavily_search`.

## Narzędzia pluginu Tavily

### `tavily_search`

Użyj tego, gdy chcesz mieć kontrolki wyszukiwania specyficzne dla Tavily zamiast generycznego
`web_search`.

| Parametr         | Opis                                                                |
| ---------------- | ------------------------------------------------------------------- |
| `query`           | Ciąg zapytania wyszukiwania (zachowaj poniżej 400 znaków)           |
| `search_depth`    | `basic` (domyślne, zrównoważone) lub `advanced` (najwyższa trafność, wolniejsze) |
| `topic`           | `general` (domyślne), `news` (aktualizacje w czasie rzeczywistym) lub `finance`         |
| `max_results`     | Liczba wyników, 1-20 (domyślnie: 5)                                  |
| `include_answer`  | Dołącz podsumowanie odpowiedzi wygenerowane przez AI (domyślnie: false)               |
| `time_range`      | Filtruj według świeżości: `day`, `week`, `month` lub `year`                  |
| `include_domains` | Tablica domen, do których mają być ograniczone wyniki                               |
| `exclude_domains` | Tablica domen, które mają zostać wykluczone z wyników                              |

**Głębokość wyszukiwania:**

| Głębokość      | Szybkość | Trafność | Najlepsze zastosowanie                            |
| -------------- | -------- | -------- | ------------------------------------------------ |
| `basic`    | Szybsze | Wysoka      | Zapytania ogólnego przeznaczenia (domyślnie)   |
| `advanced` | Wolniejsze | Najwyższa   | Precyzja, konkretne fakty, research |

### `tavily_extract`

Użyj tego do wyodrębnienia czystej treści z jednego lub większej liczby adresów URL. Obsługuje
strony renderowane przez JavaScript i wspiera dzielenie na fragmenty ukierunkowane na zapytanie dla celowanej
ekstrakcji.

| Parametr           | Opis                                                |
| ------------------ | --------------------------------------------------- |
| `urls`              | Tablica adresów URL do wyodrębnienia (1-20 na żądanie)                |
| `query`             | Przestaw kolejność wyodrębnionych fragmentów według trafności względem tego zapytania         |
| `extract_depth`     | `basic` (domyślne, szybkie) lub `advanced` (dla stron mocno opartych na JS) |
| `chunks_per_source` | Fragmenty na URL, 1-5 (wymaga `query`)                     |
| `include_images`    | Dołącz adresy URL obrazów do wyników (domyślnie: false)             |

**Głębokość ekstrakcji:**

| Głębokość      | Kiedy używać                               |
| -------------- | ------------------------------------------ |
| `basic`    | Proste strony — najpierw spróbuj tego             |
| `advanced` | SPA renderowane przez JS, treści dynamiczne, tabele |

Wskazówki:

- Maksymalnie 20 adresów URL na żądanie. Większe listy dziel na wiele wywołań.
- Użyj `query` + `chunks_per_source`, aby otrzymać tylko istotną treść zamiast pełnych stron.
- Najpierw spróbuj `basic`; wróć do `advanced`, jeśli treść jest brakująca lub niepełna.

## Wybór właściwego narzędzia

| Potrzeba                                 | Narzędzie        |
| ---------------------------------------- | ---------------- |
| Szybkie wyszukiwanie w sieci, bez specjalnych opcji | `web_search`     |
| Wyszukiwanie z głębokością, tematem i odpowiedziami AI | `tavily_search`  |
| Ekstrakcja treści z konkretnych adresów URL   | `tavily_extract` |

## Powiązane

- [Web Search overview](/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Firecrawl](/tools/firecrawl) -- wyszukiwanie + scraping z ekstrakcją treści
- [Exa Search](/tools/exa-search) -- wyszukiwanie neuronowe z ekstrakcją treści
