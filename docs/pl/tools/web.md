---
read_when:
    - Chcesz włączyć lub skonfigurować `web_search`
    - Chcesz włączyć lub skonfigurować `x_search`
    - Potrzebujesz wybrać provider wyszukiwania
    - Chcesz zrozumieć auto-detekcję i fallback providera
sidebarTitle: Web Search
summary: '`web_search`, `x_search` i `web_fetch` — przeszukuj sieć, przeszukuj posty w X albo pobieraj zawartość stron'
title: Wyszukiwanie w sieci
x-i18n:
    generated_at: "2026-04-21T10:02:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e88a891ce28a5fe1baf4b9ce8565c59ba2d2695c63d77af232edd7f3fd2cd8a
    source_path: tools/web.md
    workflow: 15
---

# Wyszukiwanie w sieci

Narzędzie `web_search` przeszukuje sieć przy użyciu skonfigurowanego providera i
zwraca wyniki. Wyniki są buforowane według zapytania przez 15 minut (wartość konfigurowalna).

OpenClaw zawiera także `x_search` do postów w X (dawniej Twitter) oraz
`web_fetch` do lekkiego pobierania URL. W tej fazie `web_fetch` pozostaje
lokalne, podczas gdy `web_search` i `x_search` mogą pod spodem używać xAI Responses.

<Info>
  `web_search` to lekkie narzędzie HTTP, a nie automatyzacja przeglądarki. Dla
  stron intensywnie używających JS albo logowania użyj [Web Browser](/pl/tools/browser). Do
  pobierania konkretnego URL użyj [Web Fetch](/pl/tools/web-fetch).
</Info>

## Szybki start

<Steps>
  <Step title="Wybierz providera">
    Wybierz providera i wykonaj wymaganą konfigurację. Niektórzy providerzy są
    bezkluczowi, a inni używają kluczy API. Szczegóły znajdziesz na stronach
    providerów poniżej.
  </Step>
  <Step title="Skonfiguruj">
    ```bash
    openclaw configure --section web
    ```
    To zapisuje providera i potrzebne poświadczenia. Możesz też ustawić zmienną env
    (na przykład `BRAVE_API_KEY`) i pominąć ten krok dla providerów
    opartych na API.
  </Step>
  <Step title="Użyj">
    Agent może teraz wywołać `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Dla postów w X użyj:

    ```javascript
    await x_search({ query: "przepisy na obiad" });
    ```

  </Step>
</Steps>

## Wybór providera

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/pl/tools/brave-search">
    Ustrukturyzowane wyniki ze snippetami. Obsługuje tryb `llm-context`, filtry kraju/języka. Dostępny darmowy poziom.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/pl/tools/duckduckgo-search">
    Fallback bez klucza. Nie wymaga klucza API. Nieoficjalna integracja oparta na HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/pl/tools/exa-search">
    Wyszukiwanie neuronowe + słowa kluczowe z ekstrakcją treści (highlighty, tekst, podsumowania).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/pl/tools/firecrawl">
    Ustrukturyzowane wyniki. Najlepiej łączyć z `firecrawl_search` i `firecrawl_scrape` do głębokiej ekstrakcji.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/pl/tools/gemini-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami przez grounding Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/pl/tools/grok-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami przez web grounding xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/pl/tools/kimi-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami przez wyszukiwanie web Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/pl/tools/minimax-search">
    Ustrukturyzowane wyniki przez API wyszukiwania MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/pl/tools/ollama-search">
    Wyszukiwanie bez klucza przez skonfigurowany host Ollama. Wymaga `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/pl/tools/perplexity-search">
    Ustrukturyzowane wyniki z kontrolą ekstrakcji treści i filtrowaniem domen.
  </Card>
  <Card title="SearXNG" icon="server" href="/pl/tools/searxng-search">
    Samohostowane meta-wyszukiwanie. Nie wymaga klucza API. Agreguje Google, Bing, DuckDuckGo i inne.
  </Card>
  <Card title="Tavily" icon="globe" href="/pl/tools/tavily">
    Ustrukturyzowane wyniki z głębokością wyszukiwania, filtrowaniem tematów i `tavily_extract` do ekstrakcji URL.
  </Card>
</CardGroup>

### Porównanie providerów

| Provider                                  | Styl wyników                | Filtry                                           | Klucz API                                                                         |
| ----------------------------------------- | --------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| [Brave](/pl/tools/brave-search)              | Ustrukturyzowane snippety   | Kraj, język, czas, tryb `llm-context`            | `BRAVE_API_KEY`                                                                   |
| [DuckDuckGo](/pl/tools/duckduckgo-search)    | Ustrukturyzowane snippety   | --                                               | Brak (bez klucza)                                                                 |
| [Exa](/pl/tools/exa-search)                  | Ustrukturyzowane + wyodrębnione | Tryb neuronowy/słów kluczowych, data, ekstrakcja treści | `EXA_API_KEY`                                                             |
| [Firecrawl](/pl/tools/firecrawl)             | Ustrukturyzowane snippety   | Przez narzędzie `firecrawl_search`               | `FIRECRAWL_API_KEY`                                                               |
| [Gemini](/pl/tools/gemini-search)            | Syntetyzowane przez AI + cytowania | --                                         | `GEMINI_API_KEY`                                                                  |
| [Grok](/pl/tools/grok-search)                | Syntetyzowane przez AI + cytowania | --                                         | `XAI_API_KEY`                                                                     |
| [Kimi](/pl/tools/kimi-search)                | Syntetyzowane przez AI + cytowania | --                                         | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                               |
| [MiniMax Search](/pl/tools/minimax-search)   | Ustrukturyzowane snippety   | Region (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                |
| [Ollama Web Search](/pl/tools/ollama-search) | Ustrukturyzowane snippety   | --                                               | Domyślnie brak; wymagane `ollama signin`, można ponownie użyć bearer auth providera Ollama |
| [Perplexity](/pl/tools/perplexity-search)    | Ustrukturyzowane snippety   | Kraj, język, czas, domeny, limity treści         | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                       |
| [SearXNG](/pl/tools/searxng-search)          | Ustrukturyzowane snippety   | Kategorie, język                                 | Brak (samohostowane)                                                              |
| [Tavily](/pl/tools/tavily)                   | Ustrukturyzowane snippety   | Przez narzędzie `tavily_search`                  | `TAVILY_API_KEY`                                                                  |

## Auto-detekcja

## Natywne wyszukiwanie web Codex

Modele obsługujące Codex mogą opcjonalnie używać natywnego narzędzia provider Responses `web_search` zamiast zarządzanej funkcji `web_search` OpenClaw.

- Skonfiguruj je pod `tools.web.search.openaiCodex`
- Aktywuje się tylko dla modeli obsługujących Codex (`openai-codex/*` albo providerów używających `api: "openai-codex-responses"`)
- Zarządzane `web_search` nadal ma zastosowanie do modeli innych niż Codex
- `mode: "cached"` to ustawienie domyślne i zalecane
- `tools.web.search.enabled: false` wyłącza zarówno wyszukiwanie zarządzane, jak i natywne

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

Jeśli natywne wyszukiwanie Codex jest włączone, ale bieżący model nie obsługuje Codex, OpenClaw zachowuje normalne zarządzane działanie `web_search`.

## Konfigurowanie wyszukiwania w sieci

Listy providerów w dokumentacji i przepływach konfiguracji są alfabetyczne. Auto-detekcja używa
oddzielnej kolejności pierwszeństwa.

Jeśli `provider` nie jest ustawiony, OpenClaw sprawdza providerów w tej kolejności i używa
pierwszego, który jest gotowy:

Najpierw providerzy oparty na API:

1. **Brave** -- `BRAVE_API_KEY` albo `plugins.entries.brave.config.webSearch.apiKey` (kolejność 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` albo `plugins.entries.minimax.config.webSearch.apiKey` (kolejność 15)
3. **Gemini** -- `GEMINI_API_KEY` albo `plugins.entries.google.config.webSearch.apiKey` (kolejność 20)
4. **Grok** -- `XAI_API_KEY` albo `plugins.entries.xai.config.webSearch.apiKey` (kolejność 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` albo `plugins.entries.moonshot.config.webSearch.apiKey` (kolejność 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` albo `plugins.entries.perplexity.config.webSearch.apiKey` (kolejność 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` albo `plugins.entries.firecrawl.config.webSearch.apiKey` (kolejność 60)
8. **Exa** -- `EXA_API_KEY` albo `plugins.entries.exa.config.webSearch.apiKey` (kolejność 65)
9. **Tavily** -- `TAVILY_API_KEY` albo `plugins.entries.tavily.config.webSearch.apiKey` (kolejność 70)

Potem fallbacki bez klucza:

10. **DuckDuckGo** -- bezkluczowy fallback HTML bez konta i klucza API (kolejność 100)
11. **Ollama Web Search** -- bezkluczowy fallback przez skonfigurowany host Ollama; wymaga, aby Ollama było osiągalne i zalogowane przez `ollama signin`, i może ponownie używać bearer auth providera Ollama, jeśli host tego wymaga (kolejność 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` albo `plugins.entries.searxng.config.webSearch.baseUrl` (kolejność 200)

Jeśli nie wykryto żadnego providera, następuje fallback do Brave (otrzymasz błąd
brakującego klucza z prośbą o jego skonfigurowanie).

<Note>
  Wszystkie pola kluczy providerów obsługują obiekty SecretRef. W trybie auto-detect
  OpenClaw rozwiązuje tylko klucz wybranego providera — SecretRef niewybranych
  providerów pozostają nieaktywne.
</Note>

## Konfiguracja

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // domyślnie: true
        provider: "brave", // albo pomiń dla auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Konfiguracja specyficzna dla providera (klucze API, bazowe URL, tryby) znajduje się pod
`plugins.entries.<plugin>.config.webSearch.*`. Przykłady znajdziesz na stronach providerów.

Wybór fallback providera `web_fetch` jest osobny:

- wybierz go przez `tools.web.fetch.provider`
- albo pomiń to pole i pozwól, by OpenClaw automatycznie wykrył pierwszego gotowego providera web-fetch
  na podstawie dostępnych poświadczeń
- obecnie dołączonym providerem web-fetch jest Firecrawl, konfigurowany pod
  `plugins.entries.firecrawl.config.webFetch.*`

Gdy wybierzesz **Kimi** podczas `openclaw onboard` albo
`openclaw configure --section web`, OpenClaw może też zapytać o:

- region API Moonshot (`https://api.moonshot.ai/v1` albo `https://api.moonshot.cn/v1`)
- domyślny model wyszukiwania web Kimi (domyślnie `kimi-k2.6`)

Dla `x_search` skonfiguruj `plugins.entries.xai.config.xSearch.*`. Używa ono
tego samego fallbacku `XAI_API_KEY`, co wyszukiwanie web Grok.
Starsza konfiguracja `tools.web.x_search.*` jest automatycznie migrowana przez `openclaw doctor --fix`.
Gdy wybierzesz Grok podczas `openclaw onboard` albo `openclaw configure --section web`,
OpenClaw może też zaoferować opcjonalną konfigurację `x_search` przy użyciu tego samego klucza.
To osobny krok uzupełniający wewnątrz ścieżki Grok, a nie osobny wybór providera
wyszukiwania web najwyższego poziomu. Jeśli wybierzesz innego providera, OpenClaw nie
pokaże promptu `x_search`.

### Przechowywanie kluczy API

<Tabs>
  <Tab title="Plik konfiguracji">
    Uruchom `openclaw configure --section web` albo ustaw klucz bezpośrednio:

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Zmienna środowiskowa">
    Ustaw zmienną env providera w środowisku procesu Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Dla instalacji gateway umieść ją w `~/.openclaw/.env`.
    Zobacz [Env vars](/pl/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parametry narzędzia

| Parametr              | Opis                                                        |
| --------------------- | ----------------------------------------------------------- |
| `query`               | Zapytanie wyszukiwania (wymagane)                           |
| `count`               | Liczba zwracanych wyników (1-10, domyślnie: 5)              |
| `country`             | 2-literowy kod kraju ISO (np. `"US"`, `"DE"`)               |
| `language`            | Kod języka ISO 639-1 (np. `"en"`, `"de"`)                   |
| `search_lang`         | Kod języka wyszukiwania (tylko Brave)                       |
| `freshness`           | Filtr czasu: `day`, `week`, `month` albo `year`             |
| `date_after`          | Wyniki po tej dacie (YYYY-MM-DD)                            |
| `date_before`         | Wyniki przed tą datą (YYYY-MM-DD)                           |
| `ui_lang`             | Kod języka UI (tylko Brave)                                 |
| `domain_filter`       | Tablica listy dozwolonych/zabronionych domen (tylko Perplexity) |
| `max_tokens`          | Łączny budżet treści, domyślnie 25000 (tylko Perplexity)    |
| `max_tokens_per_page` | Limit tokenów na stronę, domyślnie 2048 (tylko Perplexity)  |

<Warning>
  Nie wszystkie parametry działają ze wszystkimi providerami. Tryb Brave `llm-context`
  odrzuca `ui_lang`, `freshness`, `date_after` i `date_before`.
  Gemini, Grok i Kimi zwracają jedną odpowiedź syntetyzowaną z cytowaniami. Przyjmują
  `count` dla zgodności ze wspólnym narzędziem, ale nie zmienia to kształtu
  odpowiedzi grounded.
  Perplexity zachowuje się tak samo, gdy używasz ścieżki zgodności Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` albo `OPENROUTER_API_KEY`).
  SearXNG akceptuje `http://` tylko dla zaufanych hostów prywatnej sieci albo loopback;
  publiczne endpointy SearXNG muszą używać `https://`.
  Firecrawl i Tavily obsługują przez `web_search` tylko `query` i `count`
  — dla zaawansowanych opcji używaj ich dedykowanych narzędzi.
</Warning>

## x_search

`x_search` odpytuje posty w X (dawniej Twitter) przy użyciu xAI i zwraca
odpowiedzi syntetyzowane przez AI z cytowaniami. Akceptuje zapytania w języku naturalnym i
opcjonalne ustrukturyzowane filtry. OpenClaw włącza wbudowane narzędzie xAI `x_search`
tylko w żądaniu obsługującym to wywołanie narzędzia.

<Note>
  xAI dokumentuje `x_search` jako obsługujące wyszukiwanie słów kluczowych, wyszukiwanie semantyczne, wyszukiwanie użytkowników oraz pobieranie wątków. Dla statystyk zaangażowania per post, takich jak reposty,
  odpowiedzi, zakładki czy wyświetlenia, preferuj ukierunkowane wyszukiwanie dokładnego URL posta
  lub ID statusu. Szerokie wyszukiwania słów kluczowych mogą znaleźć właściwy post, ale zwrócić mniej
  kompletnych metadanych per post. Dobry wzorzec to: najpierw zlokalizuj post, a potem
  uruchom drugie zapytanie `x_search` skoncentrowane na dokładnie tym poście.
</Note>

### Konfiguracja x_search

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // opcjonalne, jeśli ustawiono XAI_API_KEY
          },
        },
      },
    },
  },
}
```

### Parametry x_search

| Parametr                     | Opis                                                         |
| ---------------------------- | ------------------------------------------------------------ |
| `query`                      | Zapytanie wyszukiwania (wymagane)                            |
| `allowed_x_handles`          | Ogranicza wyniki do konkretnych handle w X                   |
| `excluded_x_handles`         | Wyklucza konkretne handle w X                                |
| `from_date`                  | Uwzględnia tylko posty od tej daty lub późniejsze (YYYY-MM-DD) |
| `to_date`                    | Uwzględnia tylko posty do tej daty lub wcześniejsze (YYYY-MM-DD) |
| `enable_image_understanding` | Pozwala xAI analizować obrazy dołączone do pasujących postów |
| `enable_video_understanding` | Pozwala xAI analizować filmy dołączone do pasujących postów  |

### Przykład x_search

```javascript
await x_search({
  query: "przepisy na obiad",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Statystyki per post: gdy to możliwe, użyj dokładnego URL statusu albo ID statusu
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Przykłady

```javascript
// Podstawowe wyszukiwanie
await web_search({ query: "OpenClaw plugin SDK" });

// Wyszukiwanie specyficzne dla Niemiec
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Ostatnie wyniki (ostatni tydzień)
await web_search({ query: "AI developments", freshness: "week" });

// Zakres dat
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Filtrowanie domen (tylko Perplexity)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Profile narzędzi

Jeśli używasz profili narzędzi albo list dozwolonych, dodaj `web_search`, `x_search` albo `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // albo: allow: ["group:web"]  (obejmuje web_search, x_search i web_fetch)
  },
}
```

## Powiązane

- [Web Fetch](/pl/tools/web-fetch) -- pobierz URL i wyodrębnij czytelną treść
- [Web Browser](/pl/tools/browser) -- pełna automatyzacja przeglądarki dla stron intensywnie używających JS
- [Grok Search](/pl/tools/grok-search) -- Grok jako provider `web_search`
- [Ollama Web Search](/pl/tools/ollama-search) -- wyszukiwanie w sieci bez klucza przez host Ollama
