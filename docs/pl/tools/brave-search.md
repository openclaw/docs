---
read_when:
    - Chcesz używać Brave Search dla `web_search`
    - Potrzebujesz `BRAVE_API_KEY` lub szczegółów planu
summary: Konfiguracja Brave Search API dla `web_search`
title: wyszukiwanie Brave
x-i18n:
    generated_at: "2026-04-24T09:34:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a59df7a5d52f665673b82b76ec9dce7ca34bf4e7b678029f6f7f7c5340c173b
    source_path: tools/brave-search.md
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

Ustawienia wyszukiwania Brave specyficzne dla dostawcy znajdują się teraz pod `plugins.entries.brave.config.webSearch.*`.
Starsze `tools.web.search.apiKey` nadal jest wczytywane przez warstwę zgodności, ale nie jest już kanoniczną ścieżką konfiguracji.

`webSearch.mode` kontroluje transport Brave:

- `web` (domyślnie): zwykłe wyszukiwanie internetowe Brave z tytułami, URL-ami i fragmentami
- `llm-context`: Brave LLM Context API z wcześniej wyodrębnionymi fragmentami tekstu i źródłami do ugruntowania odpowiedzi

## Parametry narzędzia

<ParamField path="query" type="string" required>
Zapytanie wyszukiwania.
</ParamField>

<ParamField path="count" type="number" default="5">
Liczba wyników do zwrócenia (1–10).
</ParamField>

<ParamField path="country" type="string">
2-literowy kod kraju ISO (np. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Kod języka ISO 639-1 dla wyników wyszukiwania (np. `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Kod języka wyszukiwania Brave (np. `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
Kod języka ISO dla elementów interfejsu.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
Filtr czasu — `day` oznacza 24 godziny.
</ParamField>

<ParamField path="date_after" type="string">
Tylko wyniki opublikowane po tej dacie (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
Tylko wyniki opublikowane przed tą datą (`YYYY-MM-DD`).
</ParamField>

**Przykłady:**

```javascript
// Wyszukiwanie specyficzne dla kraju i języka
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Ostatnie wyniki (ostatni tydzień)
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

- OpenClaw używa planu Brave **Search**. Jeśli masz starszą subskrypcję (np. oryginalny plan Free z 2 000 zapytań miesięcznie), nadal jest ważna, ale nie obejmuje nowszych funkcji, takich jak LLM Context ani wyższe limity szybkości.
- Każdy plan Brave obejmuje **5 USD miesięcznie darmowego kredytu** (odnawianego). Plan Search kosztuje 5 USD za 1 000 żądań, więc kredyt pokrywa 1 000 zapytań miesięcznie. Ustaw limit użycia w panelu Brave, aby uniknąć nieoczekiwanych opłat. Aktualne plany znajdziesz w [portalu Brave API](https://brave.com/search/api/).
- Plan Search obejmuje endpoint LLM Context oraz prawa do inferencji AI. Zapisywanie wyników w celu trenowania lub dostrajania modeli wymaga planu z wyraźnymi prawami do przechowywania. Zobacz [Warunki korzystania z usługi](https://api-dashboard.search.brave.com/terms-of-service) Brave.
- Tryb `llm-context` zwraca ugruntowane wpisy źródeł zamiast zwykłego formatu fragmentów wyszukiwania internetowego.
- Tryb `llm-context` nie obsługuje `ui_lang`, `freshness`, `date_after` ani `date_before`.
- `ui_lang` musi zawierać podtag regionu, np. `en-US`.
- Wyniki są domyślnie buforowane przez 15 minut (konfigurowalne przez `cacheTtlMinutes`).

## Powiązane

- [Przegląd Web Search](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Perplexity Search](/pl/tools/perplexity-search) -- uporządkowane wyniki z filtrowaniem domen
- [Exa Search](/pl/tools/exa-search) -- wyszukiwanie neuronowe z ekstrakcją treści
