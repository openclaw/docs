---
read_when:
    - Chcesz używać Brave Search do `web_search`
    - Potrzebujesz `BRAVE_API_KEY` lub szczegółów planu
summary: Konfiguracja Brave Search API dla `web_search`
title: Brave Search (starsza ścieżka)
x-i18n:
    generated_at: "2026-04-24T08:57:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2769da4db2ff5b94217c09b13ef5ee4106ba108a828db2a99892a4a15d7b517
    source_path: brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw obsługuje Brave Search API jako dostawcę `web_search`.

## Uzyskaj klucz API

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
            mode: "web", // lub "llm-context"
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

Ustawienia Brave specyficzne dla dostawcy znajdują się teraz w `plugins.entries.brave.config.webSearch.*`.
Starsza ścieżka `tools.web.search.apiKey` nadal jest wczytywana przez warstwę zgodności, ale nie jest już kanoniczną ścieżką konfiguracji.

`webSearch.mode` określa sposób komunikacji Brave:

- `web` (domyślnie): standardowe wyszukiwanie internetowe Brave z tytułami, adresami URL i fragmentami
- `llm-context`: Brave LLM Context API z wcześniej wyodrębnionymi fragmentami tekstu i źródłami do ugruntowania odpowiedzi

## Parametry narzędzia

| Parameter     | Description                                                         |
| ------------- | ------------------------------------------------------------------- |
| `query`       | Zapytanie wyszukiwania (wymagane)                                   |
| `count`       | Liczba wyników do zwrócenia (1-10, domyślnie: 5)                    |
| `country`     | 2-literowy kod kraju ISO (np. "US", "DE")                           |
| `language`    | Kod języka ISO 639-1 dla wyników wyszukiwania (np. "en", "de", "fr") |
| `search_lang` | Kod języka wyszukiwania Brave (np. `en`, `en-gb`, `zh-hans`)        |
| `ui_lang`     | Kod języka ISO dla elementów interfejsu użytkownika                 |
| `freshness`   | Filtr czasu: `day` (24 h), `week`, `month` lub `year`               |
| `date_after`  | Tylko wyniki opublikowane po tej dacie (YYYY-MM-DD)                 |
| `date_before` | Tylko wyniki opublikowane przed tą datą (YYYY-MM-DD)                |

**Przykłady:**

```javascript
// Wyszukiwanie specyficzne dla kraju i języka
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Ostatnie wyniki (z ostatniego tygodnia)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Wyszukiwanie w zakresie dat
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## Uwagi

- OpenClaw używa planu Brave **Search**. Jeśli masz starszą subskrypcję (np. pierwotny plan Free z limitem 2 000 zapytań miesięcznie), nadal jest ona ważna, ale nie obejmuje nowszych funkcji, takich jak LLM Context ani wyższe limity szybkości.
- Każdy plan Brave obejmuje **5 USD miesięcznie darmowego kredytu** (odnawialnego). Plan Search kosztuje 5 USD za 1 000 żądań, więc kredyt pokrywa 1 000 zapytań miesięcznie. Ustaw limit użycia w panelu Brave, aby uniknąć nieoczekiwanych opłat. Aktualne plany znajdziesz w [portalu Brave API](https://brave.com/search/api/).
- Plan Search obejmuje punkt końcowy LLM Context i prawa do inferencji AI. Przechowywanie wyników w celu trenowania lub dostrajania modeli wymaga planu z wyraźnie określonymi prawami do przechowywania. Zobacz [Warunki korzystania z usługi](https://api-dashboard.search.brave.com/terms-of-service) Brave.
- Tryb `llm-context` zwraca ugruntowane wpisy źródłowe zamiast standardowego formatu fragmentów wyszukiwania internetowego.
- Tryb `llm-context` nie obsługuje `ui_lang`, `freshness`, `date_after` ani `date_before`.
- `ui_lang` musi zawierać podtag regionu, na przykład `en-US`.
- Wyniki są domyślnie buforowane przez 15 minut (konfigurowalne przez `cacheTtlMinutes`).

Pełną konfigurację `web_search` znajdziesz w sekcji [Narzędzia internetowe](/pl/tools/web).

## Powiązane

- [Brave Search](/pl/tools/brave-search)
