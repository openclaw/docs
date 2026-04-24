---
read_when:
    - Chcesz włączyć albo skonfigurować `web_search`
    - Chcesz włączyć albo skonfigurować `x_search`
    - Musisz wybrać providera wyszukiwania
    - Chcesz zrozumieć automatyczne wykrywanie i fallback providera
sidebarTitle: Web Search
summary: '`web_search`, `x_search` i `web_fetch` — przeszukuj sieć, wyszukuj posty na X albo pobieraj treść stron'
title: Wyszukiwanie w sieci
x-i18n:
    generated_at: "2026-04-24T09:39:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2713e8b13cf0f3c6bba38bee50c24771b914a5cd235ca521bed434a6ddbe2305
    source_path: tools/web.md
    workflow: 15
---

Narzędzie `web_search` przeszukuje sieć przy użyciu skonfigurowanego providera i
zwraca wyniki. Wyniki są кешowane według zapytania przez 15 minut (konfigurowalne).

OpenClaw zawiera także `x_search` dla postów na X (dawniej Twitter) oraz
`web_fetch` do lekkiego pobierania URL-i. Na tym etapie `web_fetch` pozostaje
lokalne, podczas gdy `web_search` i `x_search` mogą pod spodem używać xAI Responses.

<Info>
  `web_search` to lekkie narzędzie HTTP, a nie automatyzacja przeglądarki. Dla
  stron intensywnie używających JS albo logowań użyj [Web Browser](/pl/tools/browser). Do
  pobrania konkretnego URL-a użyj [Web Fetch](/pl/tools/web-fetch).
</Info>

## Szybki start

<Steps>
  <Step title="Choose a provider">
    Wybierz providera i wykonaj wymaganą konfigurację. Niektórzy providerzy
    nie wymagają klucza, a inni używają kluczy API. Szczegóły znajdziesz na
    stronach providerów poniżej.
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    To zapisuje providera i wszelkie potrzebne poświadczenia. Możesz też ustawić zmienną env
    (na przykład `BRAVE_API_KEY`) i pominąć ten krok dla providerów
    opartych na API.
  </Step>
  <Step title="Use it">
    Agent może teraz wywoływać `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Dla postów na X użyj:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Wybór providera

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/pl/tools/brave-search">
    Ustrukturyzowane wyniki ze snippetami. Obsługuje tryb `llm-context`, filtry kraju/języka. Dostępna darmowa warstwa.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/pl/tools/duckduckgo-search">
    Fallback bez klucza. Nie wymaga klucza API. Nieoficjalna integracja oparta na HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/pl/tools/exa-search">
    Wyszukiwanie neuronowe + słowami kluczowymi z ekstrakcją treści (wyróżnienia, tekst, podsumowania).
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
    Odpowiedzi syntetyzowane przez AI z cytowaniami przez wyszukiwanie w sieci Moonshot.
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
    Ustrukturyzowane wyniki z głębokością wyszukiwania, filtrowaniem tematów i `tavily_extract` do ekstrakcji URL-i.
  </Card>
</CardGroup>

### Porównanie providerów

| Provider                                  | Styl wyników               | Filtry                                           | Klucz API                                                                        |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Brave](/pl/tools/brave-search)              | Ustrukturyzowane snippety  | Kraj, język, czas, tryb `llm-context`            | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/pl/tools/duckduckgo-search)    | Ustrukturyzowane snippety  | --                                               | Brak (bez klucza)                                                                |
| [Exa](/pl/tools/exa-search)                  | Ustrukturyzowane + wyekstrahowane | Tryb neuronowy/słów kluczowych, data, ekstrakcja treści | `EXA_API_KEY`                                                                    |
| [Firecrawl](/pl/tools/firecrawl)             | Ustrukturyzowane snippety  | Przez narzędzie `firecrawl_search`               | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/pl/tools/gemini-search)            | Syntetyzowane przez AI + cytowania | --                                          | `GEMINI_API_KEY`                                                                 |
| [Grok](/pl/tools/grok-search)                | Syntetyzowane przez AI + cytowania | --                                          | `XAI_API_KEY`                                                                    |
| [Kimi](/pl/tools/kimi-search)                | Syntetyzowane przez AI + cytowania | --                                          | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/pl/tools/minimax-search)   | Ustrukturyzowane snippety  | Region (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                               |
| [Ollama Web Search](/pl/tools/ollama-search) | Ustrukturyzowane snippety  | --                                               | Domyślnie brak; wymagane `ollama signin`, może używać bearer auth providera Ollama |
| [Perplexity](/pl/tools/perplexity-search)    | Ustrukturyzowane snippety  | Kraj, język, czas, domeny, limity treści         | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/pl/tools/searxng-search)          | Ustrukturyzowane snippety  | Kategorie, język                                 | Brak (samohostowane)                                                             |
| [Tavily](/pl/tools/tavily)                   | Ustrukturyzowane snippety  | Przez narzędzie `tavily_search`                  | `TAVILY_API_KEY`                                                                 |

## Automatyczne wykrywanie

## Natywne OpenAI web search

Bezpośrednie modele OpenAI Responses automatycznie używają hostowanego przez OpenAI narzędzia `web_search`, gdy wyszukiwanie w sieci OpenClaw jest włączone i nie przypięto zarządzanego providera. To zachowanie należące do providera w dołączonym Pluginie OpenAI i dotyczy tylko natywnego ruchu do OpenAI API, a nie bazowych URL-i proxy zgodnych z OpenAI ani tras Azure. Ustaw `tools.web.search.provider` na innego providera, takiego jak `brave`, aby zachować zarządzane narzędzie `web_search` dla modeli OpenAI, albo ustaw `tools.web.search.enabled: false`, aby wyłączyć zarówno zarządzane wyszukiwanie, jak i natywne wyszukiwanie OpenAI.

## Natywne Codex web search

Modele obsługujące Codex mogą opcjonalnie używać natywnego narzędzia Responses `web_search` providera zamiast zarządzanej funkcji `web_search` OpenClaw.

- Skonfiguruj je pod `tools.web.search.openaiCodex`
- Aktywuje się tylko dla modeli obsługujących Codex (`openai-codex/*` albo providerów używających `api: "openai-codex-responses"`)
- Zarządzane `web_search` nadal dotyczy modeli nieobsługujących Codex
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

## Konfigurowanie web search

Listy providerów w dokumentacji i przepływach konfiguracji są w kolejności alfabetycznej. Automatyczne wykrywanie zachowuje osobną kolejność priorytetów.

Jeśli `provider` nie jest ustawiony, OpenClaw sprawdza providerów w tej kolejności i używa
pierwszego, który jest gotowy:

Najpierw providerzy oparci na API:

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

10. **DuckDuckGo** -- fallback HTML bez klucza, bez konta i bez klucza API (kolejność 100)
11. **Ollama Web Search** -- fallback bez klucza przez skonfigurowany host Ollama; wymaga, aby Ollama była osiągalna i zalogowana przez `ollama signin`, i może używać bearer auth providera Ollama, jeśli host tego wymaga (kolejność 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` albo `plugins.entries.searxng.config.webSearch.baseUrl` (kolejność 200)

Jeśli nie zostanie wykryty żaden provider, następuje fallback do Brave (otrzymasz błąd
brakującego klucza z prośbą o jego konfigurację).

<Note>
  Wszystkie pola kluczy providerów obsługują obiekty SecretRef. Zakresowane do Pluginu SecretRef
  pod `plugins.entries.<plugin>.config.webSearch.apiKey` są rozwiązywane dla
  dołączonych providerów Exa, Firecrawl, Gemini, Grok, Kimi, Perplexity i Tavily
  niezależnie od tego, czy provider został wybrany jawnie przez `tools.web.search.provider`, czy
  wybrany przez auto-detect. W trybie auto-detect OpenClaw rozwiązuje tylko klucz
  wybranego providera — SecretRef niewybranych providerów pozostają nieaktywne, więc możesz
  mieć skonfigurowanych wielu providerów bez ponoszenia kosztu rozwiązywania dla
  tych, których nie używasz.
</Note>

## Konfiguracja

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // domyślnie: true
        provider: "brave", // albo pomiń dla automatycznego wykrywania
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Konfiguracja specyficzna dla providera (klucze API, bazowe URL-e, tryby) znajduje się pod
`plugins.entries.<plugin>.config.webSearch.*`. Przykłady znajdziesz na stronach providerów.

Wybór providera fallback dla `web_fetch` jest osobny:

- wybierz go przez `tools.web.fetch.provider`
- albo pomiń to pole i pozwól OpenClaw automatycznie wykryć pierwszego gotowego providera
  `web_fetch` spośród dostępnych poświadczeń
- obecnie dołączonym providerem `web_fetch` jest Firecrawl, konfigurowany pod
  `plugins.entries.firecrawl.config.webFetch.*`

Gdy wybierzesz **Kimi** podczas `openclaw onboard` albo
`openclaw configure --section web`, OpenClaw może też zapytać o:

- region API Moonshot (`https://api.moonshot.ai/v1` albo `https://api.moonshot.cn/v1`)
- domyślny model web-search Kimi (domyślnie `kimi-k2.6`)

Dla `x_search` skonfiguruj `plugins.entries.xai.config.xSearch.*`. Używa on
tego samego fallbacku `XAI_API_KEY` co wyszukiwanie Grok w sieci.
Starsza konfiguracja `tools.web.x_search.*` jest automatycznie migrowana przez `openclaw doctor --fix`.
Gdy wybierzesz Grok podczas `openclaw onboard` albo `openclaw configure --section web`,
OpenClaw może też zaproponować opcjonalną konfigurację `x_search` z tym samym kluczem.
To osobny krok uzupełniający wewnątrz ścieżki Grok, a nie osobny wybór providera
web-search najwyższego poziomu. Jeśli wybierzesz innego providera, OpenClaw nie
pokaże promptu `x_search`.

### Przechowywanie kluczy API

<Tabs>
  <Tab title="Config file">
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
  <Tab title="Environment variable">
    Ustaw zmienną env providera w środowisku procesu Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Dla instalacji gateway umieść ją w `~/.openclaw/.env`.
    Zobacz [Env vars](/pl/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parametry narzędzia

| Parametr              | Opis                                                  |
| --------------------- | ----------------------------------------------------- |
| `query`               | Zapytanie wyszukiwania (wymagane)                     |
| `count`               | Liczba zwracanych wyników (1-10, domyślnie: 5)        |
| `country`             | 2-literowy kod kraju ISO (np. "US", "DE")            |
| `language`            | Kod języka ISO 639-1 (np. "en", "de")                |
| `search_lang`         | Kod języka wyszukiwania (tylko Brave)                 |
| `freshness`           | Filtr czasu: `day`, `week`, `month` albo `year`      |
| `date_after`          | Wyniki po tej dacie (YYYY-MM-DD)                      |
| `date_before`         | Wyniki przed tą datą (YYYY-MM-DD)                     |
| `ui_lang`             | Kod języka UI (tylko Brave)                           |
| `domain_filter`       | Tablica allowlist/denylist domen (tylko Perplexity)  |
| `max_tokens`          | Łączny budżet treści, domyślnie 25000 (tylko Perplexity) |
| `max_tokens_per_page` | Limit tokenów na stronę, domyślnie 2048 (tylko Perplexity) |

<Warning>
  Nie wszystkie parametry działają ze wszystkimi providerami. Tryb Brave `llm-context`
  odrzuca `ui_lang`, `freshness`, `date_after` i `date_before`.
  Gemini, Grok i Kimi zwracają jedną odpowiedź syntetyzowaną przez AI z cytowaniami. Akceptują
  `count` dla zgodności współdzielonego narzędzia, ale nie zmienia to kształtu
  odpowiedzi opartej na grounding.
  Perplexity zachowuje się tak samo, gdy używasz ścieżki zgodności Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` albo `OPENROUTER_API_KEY`).
  SearXNG akceptuje `http://` tylko dla zaufanych hostów sieci prywatnej albo loopback;
  publiczne endpointy SearXNG muszą używać `https://`.
  Firecrawl i Tavily obsługują przez `web_search` tylko `query` i `count`
  -- dla zaawansowanych opcji użyj ich dedykowanych narzędzi.
</Warning>

## x_search

`x_search` odpytuje posty na X (dawniej Twitter) przy użyciu xAI i zwraca
odpowiedzi syntetyzowane przez AI z cytowaniami. Akceptuje zapytania w języku naturalnym oraz
opcjonalne ustrukturyzowane filtry. OpenClaw włącza wbudowane narzędzie `x_search`
xAI tylko dla żądania obsługującego to wywołanie narzędzia.

<Note>
  xAI opisuje `x_search` jako obsługujące wyszukiwanie po słowach kluczowych, wyszukiwanie semantyczne, wyszukiwanie użytkowników
  oraz pobieranie wątków. Dla statystyk zaangażowania pojedynczego posta, takich jak reposty,
  odpowiedzi, zakładki czy wyświetlenia, preferuj ukierunkowane wyszukiwanie dokładnego URL-a posta
  albo status ID. Szerokie wyszukiwania po słowach kluczowych mogą znaleźć właściwy post, ale zwrócić
  mniej kompletne metadane pojedynczego posta. Dobry wzorzec to: najpierw znajdź post, a potem
  uruchom drugie zapytanie `x_search` skupione na dokładnie tym poście.
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

| Parametr                     | Opis                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Zapytanie wyszukiwania (wymagane)                      |
| `allowed_x_handles`          | Ogranicza wyniki do konkretnych handle na X            |
| `excluded_x_handles`         | Wyklucza konkretne handle na X                         |
| `from_date`                  | Uwzględnia tylko posty z tej daty lub później (YYYY-MM-DD) |
| `to_date`                    | Uwzględnia tylko posty z tej daty lub wcześniej (YYYY-MM-DD) |
| `enable_image_understanding` | Pozwala xAI analizować obrazy dołączone do pasujących postów |
| `enable_video_understanding` | Pozwala xAI analizować filmy dołączone do pasujących postów  |

### Przykład x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Statystyki pojedynczego posta: jeśli to możliwe, używaj dokładnego URL-a statusu albo status ID
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

Jeśli używasz profili narzędzi albo allowlist, dodaj `web_search`, `x_search` albo `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // albo: allow: ["group:web"]  (obejmuje web_search, x_search i web_fetch)
  },
}
```

## Powiązane

- [Web Fetch](/pl/tools/web-fetch) -- pobieranie URL-a i ekstrakcja czytelnej treści
- [Web Browser](/pl/tools/browser) -- pełna automatyzacja przeglądarki dla stron intensywnie używających JS
- [Grok Search](/pl/tools/grok-search) -- Grok jako provider `web_search`
- [Ollama Web Search](/pl/tools/ollama-search) -- wyszukiwanie w sieci bez klucza przez host Ollama
