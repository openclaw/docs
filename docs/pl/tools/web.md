---
read_when:
    - Chcesz włączyć lub skonfigurować web_search
    - Chcesz włączyć lub skonfigurować x_search
    - Należy wybrać dostawcę wyszukiwania
    - Chcesz zrozumieć automatyczne wykrywanie i awaryjne przełączanie dostawcy
sidebarTitle: Web Search
summary: web_search, x_search i web_fetch -- przeszukuj sieć, przeszukuj wpisy na X lub pobieraj zawartość strony
title: Wyszukiwanie w sieci
x-i18n:
    generated_at: "2026-04-30T10:25:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9f8233a33f0729c6413eda59c4ebc3338a1e398e8280eb12650197225ef8981e
    source_path: tools/web.md
    workflow: 16
---

Narzędzie `web_search` przeszukuje sieć przy użyciu skonfigurowanego dostawcy i
zwraca wyniki. Wyniki są buforowane według zapytania przez 15 minut (konfigurowalne).

OpenClaw zawiera też `x_search` dla wpisów w X (dawniej Twitter) oraz
`web_fetch` do lekkiego pobierania adresów URL. W tej fazie `web_fetch` pozostaje
lokalne, podczas gdy `web_search` i `x_search` mogą pod spodem używać xAI Responses.

<Info>
  `web_search` to lekkie narzędzie HTTP, a nie automatyzacja przeglądarki. W przypadku
  stron mocno opartych na JS lub logowań użyj [Przeglądarki internetowej](/pl/tools/browser). Do
  pobierania konkretnego adresu URL użyj [Pobierania z sieci](/pl/tools/web-fetch).
</Info>

## Szybki start

<Steps>
  <Step title="Wybierz dostawcę">
    Wybierz dostawcę i wykonaj wymaganą konfigurację. Niektórzy dostawcy są
    bezkluczowi, a inni używają kluczy API. Szczegóły znajdziesz poniżej na
    stronach dostawców.
  </Step>
  <Step title="Skonfiguruj">
    ```bash
    openclaw configure --section web
    ```
    To zapisuje dostawcę i wszystkie potrzebne dane uwierzytelniające. Możesz też ustawić zmienną env
    var (na przykład `BRAVE_API_KEY`) i pominąć ten krok w przypadku dostawców
    opartych na API.
  </Step>
  <Step title="Użyj">
    Agent może teraz wywołać `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Dla wpisów z X użyj:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Wybór dostawcy

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/pl/tools/brave-search">
    Ustrukturyzowane wyniki z fragmentami. Obsługuje tryb `llm-context` oraz filtry kraju/języka. Dostępny darmowy poziom.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/pl/tools/duckduckgo-search">
    Bezkluczowy wariant awaryjny. Klucz API nie jest potrzebny. Nieoficjalna integracja oparta na HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/pl/tools/exa-search">
    Wyszukiwanie neuronowe + słowa kluczowe z ekstrakcją treści (wyróżnienia, tekst, podsumowania).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/pl/tools/firecrawl">
    Ustrukturyzowane wyniki. Najlepiej łączyć z `firecrawl_search` i `firecrawl_scrape` do głębokiej ekstrakcji.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/pl/tools/gemini-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami przez grounding Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/pl/tools/grok-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami przez grounding sieciowy xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/pl/tools/kimi-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami przez wyszukiwanie internetowe Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/pl/tools/minimax-search">
    Ustrukturyzowane wyniki przez API wyszukiwania MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/pl/tools/ollama-search">
    Wyszukiwanie przez zalogowany lokalny host Ollama albo hostowane API Ollama.
  </Card>
  <Card title="Perplexity" icon="search" href="/pl/tools/perplexity-search">
    Ustrukturyzowane wyniki z kontrolami ekstrakcji treści i filtrowaniem domen.
  </Card>
  <Card title="SearXNG" icon="server" href="/pl/tools/searxng-search">
    Samodzielnie hostowana metawyszukiwarka. Klucz API nie jest potrzebny. Agreguje Google, Bing, DuckDuckGo i inne.
  </Card>
  <Card title="Tavily" icon="globe" href="/pl/tools/tavily">
    Ustrukturyzowane wyniki z głębokością wyszukiwania, filtrowaniem tematów oraz `tavily_extract` do ekstrakcji adresów URL.
  </Card>
</CardGroup>

### Porównanie dostawców

| Dostawca                                  | Styl wyników               | Filtry                                          | Klucz API                                                                                 |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/pl/tools/brave-search)              | Ustrukturyzowane fragmenty        | Kraj, język, czas, tryb `llm-context`      | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/pl/tools/duckduckgo-search)    | Ustrukturyzowane fragmenty        | --                                               | Brak (bez klucza)                                                                         |
| [Exa](/pl/tools/exa-search)                  | Ustrukturyzowane + wyodrębnione     | Tryb neuronowy/słów kluczowych, data, ekstrakcja treści    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/pl/tools/firecrawl)             | Ustrukturyzowane fragmenty        | Przez narzędzie `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/pl/tools/gemini-search)            | Syntetyzowane przez AI + cytowania | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/pl/tools/grok-search)                | Syntetyzowane przez AI + cytowania | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/pl/tools/kimi-search)                | Syntetyzowane przez AI + cytowania | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/pl/tools/minimax-search)   | Ustrukturyzowane fragmenty        | Region (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                      |
| [Ollama Web Search](/pl/tools/ollama-search) | Ustrukturyzowane fragmenty        | --                                               | Brak dla zalogowanych lokalnych hostów; `OLLAMA_API_KEY` dla bezpośredniego wyszukiwania `https://ollama.com` |
| [Perplexity](/pl/tools/perplexity-search)    | Ustrukturyzowane fragmenty        | Kraj, język, czas, domeny, limity treści | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/pl/tools/searxng-search)          | Ustrukturyzowane fragmenty        | Kategorie, język                             | Brak (samodzielnie hostowane)                                                                      |
| [Tavily](/pl/tools/tavily)                   | Ustrukturyzowane fragmenty        | Przez narzędzie `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## Automatyczne wykrywanie

## Natywne wyszukiwanie internetowe OpenAI

Bezpośrednie modele OpenAI Responses automatycznie używają hostowanego narzędzia `web_search` OpenAI, gdy wyszukiwanie internetowe OpenClaw jest włączone i nie przypięto zarządzanego dostawcy. To zachowanie należące do dostawcy w dołączonym Plugin OpenAI i dotyczy wyłącznie natywnego ruchu OpenAI API, a nie zgodnych z OpenAI adresów bazowych proxy ani tras Azure. Ustaw `tools.web.search.provider` na innego dostawcę, takiego jak `brave`, aby zachować zarządzane narzędzie `web_search` dla modeli OpenAI, albo ustaw `tools.web.search.enabled: false`, aby wyłączyć zarówno zarządzane wyszukiwanie, jak i natywne wyszukiwanie OpenAI.

## Natywne wyszukiwanie internetowe Codex

Modele obsługujące Codex mogą opcjonalnie używać natywnego dla dostawcy narzędzia Responses `web_search` zamiast zarządzanej funkcji `web_search` OpenClaw.

- Skonfiguruj je w `tools.web.search.openaiCodex`
- Aktywuje się tylko dla modeli obsługujących Codex (`openai-codex/*` lub dostawców używających `api: "openai-codex-responses"`)
- Zarządzane `web_search` nadal dotyczy modeli innych niż Codex
- `mode: "cached"` jest ustawieniem domyślnym i zalecanym
- `tools.web.search.enabled: false` wyłącza zarówno zarządzane, jak i natywne wyszukiwanie

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

Jeśli natywne wyszukiwanie Codex jest włączone, ale bieżący model nie obsługuje Codex, OpenClaw zachowuje normalne zarządzane zachowanie `web_search`.

## Konfigurowanie wyszukiwania internetowego

Listy dostawców w dokumentacji i przepływach konfiguracji są alfabetyczne. Automatyczne wykrywanie zachowuje
oddzielną kolejność pierwszeństwa.

Jeśli nie ustawiono `provider`, OpenClaw sprawdza dostawców w tej kolejności i używa
pierwszego, który jest gotowy:

Najpierw dostawcy oparci na API:

1. **Brave** -- `BRAVE_API_KEY` lub `plugins.entries.brave.config.webSearch.apiKey` (kolejność 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` lub `plugins.entries.minimax.config.webSearch.apiKey` (kolejność 15)
3. **Gemini** -- `GEMINI_API_KEY` lub `plugins.entries.google.config.webSearch.apiKey` (kolejność 20)
4. **Grok** -- `XAI_API_KEY` lub `plugins.entries.xai.config.webSearch.apiKey` (kolejność 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` lub `plugins.entries.moonshot.config.webSearch.apiKey` (kolejność 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` lub `plugins.entries.perplexity.config.webSearch.apiKey` (kolejność 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` lub `plugins.entries.firecrawl.config.webSearch.apiKey` (kolejność 60)
8. **Exa** -- `EXA_API_KEY` lub `plugins.entries.exa.config.webSearch.apiKey` (kolejność 65)
9. **Tavily** -- `TAVILY_API_KEY` lub `plugins.entries.tavily.config.webSearch.apiKey` (kolejność 70)

Następnie bezkluczowe warianty awaryjne:

10. **DuckDuckGo** -- bezkluczowy wariant awaryjny HTML bez konta ani klucza API (kolejność 100)
11. **Ollama Web Search** -- bezkluczowy wariant awaryjny przez skonfigurowany lokalny host Ollama, gdy jest osiągalny i zalogowany za pomocą `ollama signin`; może ponownie użyć uwierzytelniania bearer dostawcy Ollama, gdy host go wymaga, i może wywołać bezpośrednie wyszukiwanie `https://ollama.com`, gdy skonfigurowano `OLLAMA_API_KEY` (kolejność 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` lub `plugins.entries.searxng.config.webSearch.baseUrl` (kolejność 200)

Jeśli żaden dostawca nie zostanie wykryty, następuje powrót do Brave (otrzymasz błąd
brakującego klucza z prośbą o skonfigurowanie go).

<Note>
  Wszystkie pola kluczy dostawców obsługują obiekty SecretRef. SecretRefs o zakresie Plugin
  pod `plugins.entries.<plugin>.config.webSearch.apiKey` są rozwiązywane dla
  dołączonych dostawców wyszukiwania internetowego opartych na API, w tym Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity i Tavily,
  niezależnie od tego, czy dostawca jest wybrany jawnie przez `tools.web.search.provider`, czy
  wybrany przez automatyczne wykrywanie. W trybie automatycznego wykrywania OpenClaw rozwiązuje tylko
  klucz wybranego dostawcy -- niewybrane SecretRefs pozostają nieaktywne, więc możesz
  mieć skonfigurowanych wielu dostawców bez ponoszenia kosztu rozwiązywania tych,
  których nie używasz.
</Note>

## Konfiguracja

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Konfiguracja specyficzna dla dostawcy (klucze API, bazowe adresy URL, tryby) znajduje się pod
`plugins.entries.<plugin>.config.webSearch.*`. Przykłady znajdziesz na stronach dostawców.

Wybór dostawcy awaryjnego `web_fetch` jest osobny:

- wybierz go za pomocą `tools.web.fetch.provider`
- albo pomiń to pole i pozwól OpenClaw automatycznie wykryć pierwszego gotowego dostawcę
  web-fetch na podstawie dostępnych danych uwierzytelniających
- obecnie dołączonym dostawcą web-fetch jest Firecrawl, skonfigurowany pod
  `plugins.entries.firecrawl.config.webFetch.*`

Gdy wybierzesz **Kimi** podczas `openclaw onboard` lub
`openclaw configure --section web`, OpenClaw może też zapytać o:

- region API Moonshot (`https://api.moonshot.ai/v1` lub `https://api.moonshot.cn/v1`)
- domyślny model wyszukiwania internetowego Kimi (domyślnie `kimi-k2.6`)

Dla `x_search` skonfiguruj `plugins.entries.xai.config.xSearch.*`. Używa tego
samego fallbacku `XAI_API_KEY` co wyszukiwanie internetowe Grok.
Starsza konfiguracja `tools.web.x_search.*` jest automatycznie migrowana przez `openclaw doctor --fix`.
Gdy wybierzesz Grok podczas `openclaw onboard` lub `openclaw configure --section web`,
OpenClaw może też zaoferować opcjonalną konfigurację `x_search` z tym samym kluczem.
To osobny krok uzupełniający w ścieżce Grok, a nie osobny wybór dostawcy
wyszukiwania internetowego najwyższego poziomu. Jeśli wybierzesz innego dostawcę, OpenClaw nie
pokaże monitu `x_search`.

### Przechowywanie kluczy API

<Tabs>
  <Tab title="Config file">
    Uruchom `openclaw configure --section web` lub ustaw klucz bezpośrednio:

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
    Ustaw zmienną środowiskową dostawcy w środowisku procesu Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    W przypadku instalacji gateway umieść ją w `~/.openclaw/.env`.
    Zobacz [zmienne środowiskowe](/pl/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parametry narzędzia

| Parametr              | Opis                                                                  |
| --------------------- | --------------------------------------------------------------------- |
| `query`               | Zapytanie wyszukiwania (wymagane)                                     |
| `count`               | Wyniki do zwrócenia (1-10, domyślnie: 5)                              |
| `country`             | 2-literowy kod kraju ISO (np. "US", "DE")                             |
| `language`            | Kod języka ISO 639-1 (np. "en", "de")                                 |
| `search_lang`         | Kod języka wyszukiwania (tylko Brave)                                 |
| `freshness`           | Filtr czasu: `day`, `week`, `month` lub `year`                        |
| `date_after`          | Wyniki po tej dacie (YYYY-MM-DD)                                      |
| `date_before`         | Wyniki przed tą datą (YYYY-MM-DD)                                     |
| `ui_lang`             | Kod języka interfejsu użytkownika (tylko Brave)                       |
| `domain_filter`       | Tablica listy dozwolonych/zabronionych domen (tylko Perplexity)       |
| `max_tokens`          | Całkowity budżet treści, domyślnie 25000 (tylko Perplexity)           |
| `max_tokens_per_page` | Limit tokenów na stronę, domyślnie 2048 (tylko Perplexity)            |

<Warning>
  Nie wszystkie parametry działają ze wszystkimi dostawcami. Tryb Brave `llm-context`
  odrzuca `ui_lang`, `freshness`, `date_after` i `date_before`.
  Gemini, Grok i Kimi zwracają jedną zsyntetyzowaną odpowiedź z cytowaniami. Akceptują
  `count` dla zgodności ze współdzielonym narzędziem, ale nie zmienia to kształtu
  ugruntowanej odpowiedzi.
  Perplexity zachowuje się tak samo, gdy używasz ścieżki zgodności Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` lub `OPENROUTER_API_KEY`).
  SearXNG akceptuje `http://` tylko dla zaufanych hostów w sieci prywatnej lub hostów loopback;
  publiczne punkty końcowe SearXNG muszą używać `https://`.
  Firecrawl i Tavily obsługują tylko `query` i `count` przez `web_search`
  -- użyj ich dedykowanych narzędzi dla opcji zaawansowanych.
</Warning>

## x_search

`x_search` odpytuje wpisy X (dawniej Twitter) za pomocą xAI i zwraca
odpowiedzi zsyntetyzowane przez AI z cytowaniami. Akceptuje zapytania w języku naturalnym i
opcjonalne filtry strukturalne. OpenClaw włącza wbudowane narzędzie xAI `x_search`
tylko w żądaniu obsługującym to wywołanie narzędzia.

<Note>
  xAI dokumentuje `x_search` jako obsługujące wyszukiwanie słów kluczowych, wyszukiwanie semantyczne, wyszukiwanie użytkowników
  i pobieranie wątków. W przypadku statystyk zaangażowania dla pojedynczych wpisów, takich jak reposty,
  odpowiedzi, zakładki lub wyświetlenia, preferuj ukierunkowane wyszukiwanie dokładnego adresu URL wpisu
  albo identyfikatora statusu. Szerokie wyszukiwania słów kluczowych mogą znaleźć właściwy wpis, ale zwrócić mniej
  kompletne metadane pojedynczego wpisu. Dobry wzorzec to: najpierw zlokalizuj wpis, a następnie
  uruchom drugie zapytanie `x_search` skoncentrowane na tym dokładnym wpisie.
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
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
}
```

### Parametry x_search

| Parametr                     | Opis                                                     |
| ---------------------------- | -------------------------------------------------------- |
| `query`                      | Zapytanie wyszukiwania (wymagane)                        |
| `allowed_x_handles`          | Ogranicz wyniki do określonych uchwytów X                |
| `excluded_x_handles`         | Wyklucz określone uchwyty X                              |
| `from_date`                  | Uwzględniaj tylko wpisy z tej daty lub późniejsze (YYYY-MM-DD) |
| `to_date`                    | Uwzględniaj tylko wpisy z tej daty lub wcześniejsze (YYYY-MM-DD) |
| `enable_image_understanding` | Pozwól xAI analizować obrazy dołączone do pasujących wpisów |
| `enable_video_understanding` | Pozwól xAI analizować filmy dołączone do pasujących wpisów |

### Przykład x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Per-post stats: use the exact status URL or status ID when possible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Przykłady

```javascript
// Basic search
await web_search({ query: "OpenClaw plugin SDK" });

// German-specific search
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Recent results (past week)
await web_search({ query: "AI developments", freshness: "week" });

// Date range
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (Perplexity only)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Profile narzędzi

Jeśli używasz profili narzędzi lub list dozwolonych, dodaj `web_search`, `x_search` albo `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Powiązane

- [Web Fetch](/pl/tools/web-fetch) -- pobierz URL i wyodrębnij czytelną treść
- [Web Browser](/pl/tools/browser) -- pełna automatyzacja przeglądarki dla stron mocno opartych na JS
- [Grok Search](/pl/tools/grok-search) -- Grok jako dostawca `web_search`
- [Ollama Web Search](/pl/tools/ollama-search) -- wyszukiwanie internetowe bez klucza przez host Ollama
