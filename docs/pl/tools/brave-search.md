---
read_when:
    - Chcesz używać Brave Search dla web_search
    - Potrzebujesz klucza BRAVE_API_KEY lub szczegółów planu
summary: Konfiguracja interfejsu API Brave Search dla `web_search`
title: Wyszukiwanie Brave
x-i18n:
    generated_at: "2026-07-12T15:37:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35e4bc2d24769f25cac79c36607e1dfe2c6ca2078715edfaed92add070817e46
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw obsługuje Brave Search API jako dostawcę `web_search`.

## Uzyskiwanie klucza API

1. Utwórz konto Brave Search API pod adresem [https://brave.com/search/api/](https://brave.com/search/api/)
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
            baseUrl: "https://api.search.brave.com", // opcjonalne zastąpienie adresu URL serwera proxy/bazowego adresu URL
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

Ustawienia wyszukiwania specyficzne dla dostawcy Brave znajdują się w `plugins.entries.brave.config.webSearch.*`; jest to kanoniczna ścieżka konfiguracji. Współdzielone ustawienie najwyższego poziomu `tools.web.search.apiKey` oraz ustawienia `tools.web.search.brave.*` nadal są wczytywane przez mechanizm scalania zgodności, ale nowa konfiguracja powinna korzystać z powyższej ścieżki o zakresie ograniczonym do pluginu.

`webSearch.mode` steruje sposobem komunikacji z Brave:

- `web` (domyślnie): standardowe wyszukiwanie internetowe Brave z tytułami, adresami URL i fragmentami
- `llm-context`: interfejs Brave LLM Context API ze wstępnie wyodrębnionymi fragmentami tekstu i źródłami zapewniającymi oparcie w danych

`webSearch.baseUrl` może kierować żądania Brave do zaufanego serwera proxy
lub Gateway zgodnego z Brave. OpenClaw dołącza `/res/v1/web/search` albo `/res/v1/llm/context` do
skonfigurowanego bazowego adresu URL i uwzględnia bazowy adres URL w kluczu pamięci podręcznej. Publiczne
punkty końcowe muszą używać `https://`; protokół `http://` jest akceptowany tylko w przypadku zaufanych hostów proxy
local loopback lub sieci prywatnej.

## Parametry narzędzia

<ParamField path="query" type="string" required>
Zapytanie wyszukiwania.
</ParamField>

<ParamField path="count" type="number" default="5">
Liczba zwracanych wyników (1–10).
</ParamField>

<ParamField path="country" type="string">
Dwuliterowy kod kraju ISO (np. `US`, `DE`).
</ParamField>

<ParamField path="language" type="string">
Kod języka ISO 639-1 wyników wyszukiwania (np. `en`, `de`, `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
Kod języka wyszukiwania Brave (np. `en`, `en-gb`, `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
Kod języka ISO elementów interfejsu użytkownika.
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
// Wyszukiwanie według kraju i języka
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Ostatnie wyniki (z ubiegłego tygodnia)
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

- OpenClaw korzysta z planu Brave **Search**. Jeśli masz starszą subskrypcję (np. pierwotny bezpłatny plan z limitem 2000 zapytań miesięcznie), pozostaje ona ważna, ale nie obejmuje nowszych funkcji, takich jak LLM Context, ani wyższych limitów częstotliwości.
- Każdy plan Brave obejmuje **5 USD bezpłatnego, odnawianego co miesiąc salda**. Plan Search kosztuje 5 USD za 1000 żądań, więc saldo pokrywa 1000 zapytań miesięcznie. Ustaw limit użycia w panelu Brave, aby uniknąć nieoczekiwanych opłat. Aktualne plany znajdziesz w [portalu Brave API](https://brave.com/search/api/).
- Plan Search obejmuje punkt końcowy LLM Context i prawa do wnioskowania AI. Przechowywanie wyników w celu trenowania lub dostrajania modeli wymaga planu z wyraźnie przyznanymi prawami do przechowywania danych. Zobacz [Warunki korzystania z usługi](https://api-dashboard.search.brave.com/terms-of-service) Brave.
- Tryb `llm-context` zwraca wpisy źródłowe oparte na danych zamiast standardowej struktury fragmentów wyników wyszukiwania internetowego.
- Tryb `llm-context` obsługuje `freshness` oraz ograniczone zakresy `date_after` + `date_before`. Nie obsługuje `ui_lang`; ustawienie `date_before` bez `date_after` jest odrzucane, ponieważ Brave wymaga, aby niestandardowe zakresy aktualności zawierały zarówno datę początkową, jak i końcową.
- `ui_lang` musi zawierać podznacznik regionu, na przykład `en-US`.
- Wyniki są domyślnie przechowywane w pamięci podręcznej przez 15 minut (można to skonfigurować za pomocą `cacheTtlMinutes`).
- Niestandardowe wartości `webSearch.baseUrl` są uwzględniane w identyfikatorze pamięci podręcznej Brave, dzięki czemu
  odpowiedzi specyficzne dla serwera proxy nie kolidują ze sobą.
- Włącz flagę diagnostyczną `brave.http`, aby podczas rozwiązywania problemów rejestrować adresy URL i parametry zapytań Brave, stan i czas odpowiedzi oraz zdarzenia trafienia, pominięcia i zapisu w pamięci podręcznej wyszukiwania. Flaga nigdy nie rejestruje klucza API ani treści odpowiedzi, jednak zapytania wyszukiwania mogą zawierać dane wrażliwe.

## Powiązane

- [Omówienie wyszukiwania internetowego](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Wyszukiwanie Perplexity](/pl/tools/perplexity-search) -- ustrukturyzowane wyniki z filtrowaniem według domen
- [Wyszukiwanie Exa](/pl/tools/exa-search) -- wyszukiwanie neuronowe z wyodrębnianiem treści
