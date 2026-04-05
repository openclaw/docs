---
read_when:
    - Chcesz używać Brave Search dla web_search
    - Potrzebujesz `BRAVE_API_KEY` lub informacji o planie
summary: Konfiguracja Brave Search API dla web_search
title: Brave Search (starsza ścieżka)
x-i18n:
    generated_at: "2026-04-05T13:42:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7788e4cee7dc460819e55095c87df8cea29ba3a8bd3cef4c0e98ac601b45b651
    source_path: brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw obsługuje Brave Search API jako dostawcę `web_search`.

## Uzyskiwanie klucza API

1. Utwórz konto Brave Search API na stronie [https://brave.com/search/api/](https://brave.com/search/api/)
2. W panelu wybierz plan **Search** i wygeneruj klucz API.
3. Zapisz klucz w konfiguracji lub ustaw `BRAVE_API_KEY` w środowisku Gateway.

## Przykład konfiguracji

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

Ustawienia wyszukiwania Brave specyficzne dla dostawcy znajdują się teraz w `plugins.entries.brave.config.webSearch.*`.
Starsze `tools.web.search.apiKey` nadal wczytuje się przez warstwę zgodności, ale nie jest już kanoniczną ścieżką konfiguracji.

`webSearch.mode` kontroluje transport Brave:

- `web` (domyślnie): zwykłe wyszukiwanie Brave w sieci z tytułami, adresami URL i fragmentami
- `llm-context`: Brave LLM Context API z wcześniej wyodrębnionymi fragmentami tekstu i źródłami do ugruntowania odpowiedzi

## Parametry narzędzia

| Parametr      | Opis                                                                |
| ------------- | ------------------------------------------------------------------- |
| `query`       | Zapytanie wyszukiwania (wymagane)                                   |
| `count`       | Liczba wyników do zwrócenia (1-10, domyślnie: 5)                    |
| `country`     | 2-literowy kod kraju ISO (np. „US”, „DE”)                           |
| `language`    | Kod języka ISO 639-1 dla wyników wyszukiwania (np. „en”, „de”, „fr”) |
| `search_lang` | Kod języka wyszukiwania Brave (np. `en`, `en-gb`, `zh-hans`)        |
| `ui_lang`     | Kod języka ISO dla elementów interfejsu                             |
| `freshness`   | Filtr czasu: `day` (24 h), `week`, `month` lub `year`               |
| `date_after`  | Tylko wyniki opublikowane po tej dacie (RRRR-MM-DD)                 |
| `date_before` | Tylko wyniki opublikowane przed tą datą (RRRR-MM-DD)                |

**Przykłady:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Uwagi

- OpenClaw używa planu Brave **Search**. Jeśli masz starszą subskrypcję (na przykład oryginalny plan Free z limitem 2000 zapytań miesięcznie), nadal pozostaje ona ważna, ale nie obejmuje nowszych funkcji, takich jak LLM Context ani wyższe limity szybkości.
- Każdy plan Brave obejmuje **5 USD miesięcznie darmowego kredytu** (odnawianego). Plan Search kosztuje 5 USD za 1000 żądań, więc kredyt pokrywa 1000 zapytań miesięcznie. Ustaw limit wykorzystania w panelu Brave, aby uniknąć nieoczekiwanych opłat. Aktualne plany znajdziesz w [portalu Brave API](https://brave.com/search/api/).
- Plan Search obejmuje punkt końcowy LLM Context oraz prawa do inferencji AI. Zapisywanie wyników w celu trenowania lub dostrajania modeli wymaga planu z jawnymi prawami do przechowywania. Zobacz [Warunki korzystania z usługi](https://api-dashboard.search.brave.com/terms-of-service) Brave.
- Tryb `llm-context` zwraca ugruntowane wpisy źródłowe zamiast standardowego formatu fragmentów wyszukiwania w sieci.
- Tryb `llm-context` nie obsługuje `ui_lang`, `freshness`, `date_after` ani `date_before`.
- `ui_lang` musi zawierać podtag regionu, taki jak `en-US`.
- Wyniki są domyślnie buforowane przez 15 minut (można to skonfigurować przez `cacheTtlMinutes`).

Pełną konfigurację `web_search` znajdziesz w [Narzędzia internetowe](/tools/web).
