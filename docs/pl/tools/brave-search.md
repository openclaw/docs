---
read_when:
    - Chcesz używać Brave Search do web_search
    - Potrzebujesz klucza BRAVE_API_KEY lub szczegółów planu
summary: Konfiguracja Brave Search API dla web_search
title: Wyszukiwarka Brave
x-i18n:
    generated_at: "2026-05-06T09:31:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2bff7589ddb54d002853898c6fc37e613fd32b0fa69cb0d712d5955973efb39
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw obsługuje Brave Search API jako dostawcę `web_search`.

## Uzyskaj klucz API

1. Utwórz konto Brave Search API na [https://brave.com/search/api/](https://brave.com/search/api/)
2. W panelu wybierz plan **Search** i wygeneruj klucz API.
3. Zapisz klucz w konfiguracji albo ustaw `BRAVE_API_KEY` w środowisku Gateway.

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
            baseUrl: "https://api.search.brave.com", // optional proxy/base URL override
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

`webSearch.mode` steruje transportem Brave:

- `web` (domyślnie): normalne wyszukiwanie web Brave z tytułami, adresami URL i fragmentami
- `llm-context`: Brave LLM Context API ze wstępnie wyodrębnionymi fragmentami tekstu i źródłami do ugruntowania

`webSearch.baseUrl` może kierować żądania Brave do zaufanego proxy zgodnego z Brave
lub Gateway. OpenClaw dodaje `/res/v1/web/search` albo `/res/v1/llm/context` do
skonfigurowanego bazowego adresu URL i zachowuje bazowy adres URL w kluczu cache. Publiczne
endpointy muszą używać `https://`; `http://` jest akceptowane tylko dla zaufanego local loopback
lub hostów proxy w sieci prywatnej.

## Parametry narzędzia

<ParamField path="query" type="string" required>
Zapytanie wyszukiwania.
</ParamField>

<ParamField path="count" type="number" default="5">
Liczba wyników do zwrócenia (1–10).
</ParamField>

<ParamField path="country" type="string">
Dwuliterowy kod kraju ISO (np. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Kod języka ISO 639-1 dla wyników wyszukiwania (np. `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Kod języka wyszukiwania Brave (np. `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
Kod języka ISO dla elementów interfejsu użytkownika.
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

- OpenClaw używa planu **Search** Brave. Jeśli masz starszą subskrypcję (np. pierwotny plan Free z 2000 zapytań miesięcznie), pozostaje ona ważna, ale nie obejmuje nowszych funkcji, takich jak LLM Context, ani wyższych limitów szybkości.
- Każdy plan Brave obejmuje **\$5 miesięcznie darmowego kredytu** (odnawianego). Plan Search kosztuje \$5 za 1000 żądań, więc kredyt pokrywa 1000 zapytań miesięcznie. Ustaw limit użycia w panelu Brave, aby uniknąć nieoczekiwanych opłat. Zobacz [portal Brave API](https://brave.com/search/api/), aby sprawdzić aktualne plany.
- Plan Search obejmuje endpoint LLM Context oraz prawa do inferencji AI. Przechowywanie wyników w celu trenowania lub dostrajania modeli wymaga planu z wyraźnymi prawami do przechowywania. Zobacz Brave [Warunki korzystania z usługi](https://api-dashboard.search.brave.com/terms-of-service).
- Tryb `llm-context` zwraca ugruntowane wpisy źródeł zamiast normalnego kształtu fragmentów wyszukiwania web.
- Tryb `llm-context` obsługuje `freshness` oraz ograniczone zakresy `date_after` + `date_before`. Nie obsługuje `ui_lang`; `date_before` bez `date_after` jest odrzucane, ponieważ Brave wymaga, aby niestandardowe zakresy świeżości zawierały zarówno datę rozpoczęcia, jak i zakończenia.
- `ui_lang` musi zawierać podtag regionu, taki jak `en-US`.
- Wyniki są domyślnie buforowane przez 15 minut (konfigurowalne przez `cacheTtlMinutes`).
- Niestandardowe wartości `webSearch.baseUrl` są uwzględniane w tożsamości cache Brave, więc
  odpowiedzi specyficzne dla proxy nie kolidują ze sobą.
- Włącz flagę diagnostyczną `brave.http`, aby podczas rozwiązywania problemów rejestrować adresy URL/parametry zapytań żądań Brave, status/czas odpowiedzi oraz zdarzenia trafienia/chybienia/zapisu w cache wyszukiwania. Flaga nigdy nie rejestruje klucza API ani treści odpowiedzi, ale zapytania wyszukiwania mogą być wrażliwe.

## Powiązane

- [Omówienie Web Search](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Perplexity Search](/pl/tools/perplexity-search) -- strukturyzowane wyniki z filtrowaniem domen
- [Exa Search](/pl/tools/exa-search) -- wyszukiwanie neuronowe z wyodrębnianiem treści
