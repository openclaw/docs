---
read_when:
    - Chcesz włączyć lub skonfigurować web_search
    - Chcesz włączyć lub skonfigurować x_search
    - Musisz wybrać dostawcę wyszukiwania
    - Chcesz zrozumieć automatyczne wykrywanie i awaryjne przełączanie dostawcy
sidebarTitle: Web Search
summary: web_search, x_search i web_fetch -- przeszukują sieć, wyszukują posty w X lub pobierają treść strony
title: Wyszukiwanie w sieci
x-i18n:
    generated_at: "2026-05-02T10:06:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: faa333a522a6690e92e8bd00c6096c84b386a97cbfeb508654929a409b39b8ef
    source_path: tools/web.md
    workflow: 16
---

Narzędzie `web_search` przeszukuje internet za pomocą skonfigurowanego dostawcy i
zwraca wyniki. Wyniki są buforowane według zapytania przez 15 minut (konfigurowalne).

OpenClaw zawiera także `x_search` dla postów z X (dawniej Twitter) oraz
`web_fetch` do lekkiego pobierania adresów URL. Na tym etapie `web_fetch` pozostaje
lokalne, a `web_search` i `x_search` mogą używać pod spodem xAI Responses.

<Info>
  `web_search` to lekkie narzędzie HTTP, a nie automatyzacja przeglądarki. W przypadku
  stron mocno opartych na JS lub logowań użyj [Przeglądarki internetowej](/pl/tools/browser). Do
  pobierania konkretnego adresu URL użyj [Web Fetch](/pl/tools/web-fetch).
</Info>

## Szybki start

<Steps>
  <Step title="Wybierz dostawcę">
    Wybierz dostawcę i wykonaj wymaganą konfigurację. Niektórzy dostawcy
    nie wymagają klucza, a inni używają kluczy API. Szczegóły znajdziesz na
    stronach dostawców poniżej.
  </Step>
  <Step title="Skonfiguruj">
    ```bash
    openclaw configure --section web
    ```
    Spowoduje to zapisanie dostawcy i wszystkich potrzebnych poświadczeń. Możesz też ustawić zmienną
    środowiskową (na przykład `BRAVE_API_KEY`) i pominąć ten krok dla dostawców
    opartych na API.
  </Step>
  <Step title="Użyj">
    Agent może teraz wywołać `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    W przypadku postów z X użyj:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Wybór dostawcy

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/pl/tools/brave-search">
    Ustrukturyzowane wyniki z fragmentami. Obsługuje tryb `llm-context` oraz filtry kraju/języka. Dostępny plan bezpłatny.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/pl/tools/duckduckgo-search">
    Awaryjny wariant bez klucza. Klucz API nie jest potrzebny. Nieoficjalna integracja oparta na HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/pl/tools/exa-search">
    Wyszukiwanie neuronowe i słowami kluczowymi z ekstrakcją treści (wyróżnienia, tekst, streszczenia).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/pl/tools/firecrawl">
    Ustrukturyzowane wyniki. Najlepiej łączyć z `firecrawl_search` i `firecrawl_scrape` do głębokiej ekstrakcji.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/pl/tools/gemini-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami przez ugruntowanie w Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/pl/tools/grok-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami przez ugruntowanie internetowe xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/pl/tools/kimi-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami przez wyszukiwanie internetowe Moonshot; nieugruntowane awaryjne odpowiedzi czatu jawnie kończą się błędem.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/pl/tools/minimax-search">
    Ustrukturyzowane wyniki przez API wyszukiwania MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/pl/tools/ollama-search">
    Wyszukiwanie przez zalogowany lokalny host Ollama lub hostowane API Ollama.
  </Card>
  <Card title="Perplexity" icon="search" href="/pl/tools/perplexity-search">
    Ustrukturyzowane wyniki z kontrolą ekstrakcji treści i filtrowaniem domen.
  </Card>
  <Card title="SearXNG" icon="server" href="/pl/tools/searxng-search">
    Samodzielnie hostowane metawyszukiwanie. Klucz API nie jest potrzebny. Agreguje Google, Bing, DuckDuckGo i inne.
  </Card>
  <Card title="Tavily" icon="globe" href="/pl/tools/tavily">
    Ustrukturyzowane wyniki z głębokością wyszukiwania, filtrowaniem tematów i `tavily_extract` do ekstrakcji adresów URL.
  </Card>
</CardGroup>

### Porównanie dostawców

| Dostawca                                  | Styl wyników                                                   | Filtry                                           | Klucz API                                                                                |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/pl/tools/brave-search)              | Ustrukturyzowane fragmenty                                     | Kraj, język, czas, tryb `llm-context`            | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/pl/tools/duckduckgo-search)    | Ustrukturyzowane fragmenty                                     | --                                               | Brak (bez klucza)                                                                       |
| [Exa](/pl/tools/exa-search)                  | Ustrukturyzowane + wyekstrahowane                              | Tryb neuronowy/słów kluczowych, data, ekstrakcja treści | `EXA_API_KEY`                                                                           |
| [Firecrawl](/pl/tools/firecrawl)             | Ustrukturyzowane fragmenty                                     | Przez narzędzie `firecrawl_search`               | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/pl/tools/gemini-search)            | Syntetyzowane przez AI + cytowania                             | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/pl/tools/grok-search)                | Syntetyzowane przez AI + cytowania                             | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/pl/tools/kimi-search)                | Syntetyzowane przez AI + cytowania; kończy się błędem przy nieugruntowanych awaryjnych odpowiedziach czatu | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/pl/tools/minimax-search)   | Ustrukturyzowane fragmenty                                     | Region (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/pl/tools/ollama-search) | Ustrukturyzowane fragmenty                                     | --                                               | Brak dla zalogowanych hostów lokalnych; `OLLAMA_API_KEY` do bezpośredniego wyszukiwania `https://ollama.com` |
| [Perplexity](/pl/tools/perplexity-search)    | Ustrukturyzowane fragmenty                                     | Kraj, język, czas, domeny, limity treści         | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/pl/tools/searxng-search)          | Ustrukturyzowane fragmenty                                     | Kategorie, język                                 | Brak (samodzielnie hostowane)                                                           |
| [Tavily](/pl/tools/tavily)                   | Ustrukturyzowane fragmenty                                     | Przez narzędzie `tavily_search`                  | `TAVILY_API_KEY`                                                                        |

## Automatyczne wykrywanie

## Natywne wyszukiwanie internetowe OpenAI

Modele Direct OpenAI Responses automatycznie używają hostowanego przez OpenAI narzędzia `web_search`, gdy wyszukiwanie internetowe OpenClaw jest włączone i nie przypięto zarządzanego dostawcy. Jest to zachowanie należące do dostawcy w dołączonym Pluginie OpenAI i dotyczy tylko natywnego ruchu API OpenAI, a nie adresów bazowych proxy zgodnych z OpenAI ani tras Azure. Ustaw `tools.web.search.provider` na innego dostawcę, takiego jak `brave`, aby zachować zarządzane narzędzie `web_search` dla modeli OpenAI, albo ustaw `tools.web.search.enabled: false`, aby wyłączyć zarówno zarządzane wyszukiwanie, jak i natywne wyszukiwanie OpenAI.

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
osobną kolejność priorytetów.

Jeśli nie ustawiono `provider`, OpenClaw sprawdza dostawców w tej kolejności i używa
pierwszego, który jest gotowy:

Najpierw dostawcy oparci na API:

1. **Brave** -- `BRAVE_API_KEY` lub `plugins.entries.brave.config.webSearch.apiKey` (kolejność 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` lub `plugins.entries.minimax.config.webSearch.apiKey` (kolejność 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` lub `models.providers.google.apiKey` (kolejność 20)
4. **Grok** -- `XAI_API_KEY` lub `plugins.entries.xai.config.webSearch.apiKey` (kolejność 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` lub `plugins.entries.moonshot.config.webSearch.apiKey` (kolejność 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` lub `plugins.entries.perplexity.config.webSearch.apiKey` (kolejność 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` lub `plugins.entries.firecrawl.config.webSearch.apiKey` (kolejność 60)
8. **Exa** -- `EXA_API_KEY` lub `plugins.entries.exa.config.webSearch.apiKey`; opcjonalne `plugins.entries.exa.config.webSearch.baseUrl` zastępuje punkt końcowy Exa (kolejność 65)
9. **Tavily** -- `TAVILY_API_KEY` lub `plugins.entries.tavily.config.webSearch.apiKey` (kolejność 70)

Następnie awaryjne warianty bez klucza:

10. **DuckDuckGo** -- awaryjny wariant HTML bez klucza, bez konta ani klucza API (kolejność 100)
11. **Ollama Web Search** -- awaryjny wariant bez klucza przez skonfigurowany lokalny host Ollama, gdy jest osiągalny i zalogowany za pomocą `ollama signin`; może ponownie użyć uwierzytelniania bearer dostawcy Ollama, gdy host go wymaga, i może wywoływać bezpośrednie wyszukiwanie `https://ollama.com`, gdy skonfigurowano `OLLAMA_API_KEY` (kolejność 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` lub `plugins.entries.searxng.config.webSearch.baseUrl` (kolejność 200)

Jeśli nie wykryto żadnego dostawcy, następuje powrót do Brave (otrzymasz błąd
brakującego klucza z prośbą o skonfigurowanie go).

<Note>
  Wszystkie pola kluczy dostawców obsługują obiekty SecretRef. SecretRefy o zakresie Pluginu
  w `plugins.entries.<plugin>.config.webSearch.apiKey` są rozwiązywane dla
  dołączonych dostawców wyszukiwania internetowego opartych na API, w tym Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity i Tavily,
  niezależnie od tego, czy dostawca jest wybrany jawnie przez `tools.web.search.provider`, czy
  wybrany przez automatyczne wykrywanie. W trybie automatycznego wykrywania OpenClaw rozwiązuje tylko
  klucz wybranego dostawcy -- niewybrane SecretRefy pozostają nieaktywne, więc możesz
  skonfigurować wielu dostawców bez ponoszenia kosztu rozwiązywania dla tych,
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

Konfiguracja właściwa dla dostawcy (klucze API, bazowe adresy URL, tryby) znajduje się w
`plugins.entries.<plugin>.config.webSearch.*`. Gemini może też ponownie użyć
`models.providers.google.apiKey` i `models.providers.google.baseUrl` jako awaryjnych opcji o niższym priorytecie
po dedykowanej konfiguracji wyszukiwania internetowego i `GEMINI_API_KEY`. Zobacz
strony dostawców, aby znaleźć przykłady.

`tools.web.search.provider` jest walidowany względem identyfikatorów dostawców wyszukiwania w sieci zadeklarowanych w manifestach Plugin dołączonych i zainstalowanych. Literówka taka jak `"brvae"` powoduje błąd walidacji konfiguracji zamiast cichego powrotu do automatycznego wykrywania. Jeśli skonfigurowany dostawca ma tylko nieaktualne dowody Plugin, takie jak pozostały blok `plugins.entries.<plugin>` po odinstalowaniu Plugin innej firmy, OpenClaw zachowuje odporne uruchamianie i zgłasza ostrzeżenie, aby można było ponownie zainstalować Plugin albo uruchomić `openclaw doctor --fix`, aby wyczyścić nieaktualną konfigurację.

Wybór dostawcy zapasowego `web_fetch` jest oddzielny:

- wybierz go za pomocą `tools.web.fetch.provider`
- albo pomiń to pole i pozwól OpenClaw automatycznie wykryć pierwszego gotowego dostawcę web-fetch na podstawie dostępnych poświadczeń
- `web_fetch` poza piaskownicą może używać zainstalowanych dostawców Plugin, którzy deklarują `contracts.webFetchProviders`; pobierania w piaskownicy pozostają tylko z dostawcami dołączonymi
- obecnie dołączonym dostawcą web-fetch jest Firecrawl, skonfigurowany w `plugins.entries.firecrawl.config.webFetch.*`

Gdy wybierzesz **Kimi** podczas `openclaw onboard` albo `openclaw configure --section web`, OpenClaw może również zapytać o:

- region API Moonshot (`https://api.moonshot.ai/v1` albo `https://api.moonshot.cn/v1`)
- domyślny model wyszukiwania w sieci Kimi (domyślnie `kimi-k2.6`)

Dla `x_search` skonfiguruj `plugins.entries.xai.config.xSearch.*`. Używa tego samego zapasowego `XAI_API_KEY` co wyszukiwanie w sieci Grok.
Starsza konfiguracja `tools.web.x_search.*` jest automatycznie migrowana przez `openclaw doctor --fix`.
Gdy wybierzesz Grok podczas `openclaw onboard` albo `openclaw configure --section web`,
OpenClaw może również zaoferować opcjonalną konfigurację `x_search` z tym samym kluczem.
Jest to oddzielny krok uzupełniający wewnątrz ścieżki Grok, a nie osobny wybór dostawcy wyszukiwania w sieci najwyższego poziomu. Jeśli wybierzesz innego dostawcę, OpenClaw nie pokaże monitu `x_search`.

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
    Ustaw zmienną środowiskową dostawcy w środowisku procesu Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    W przypadku instalacji Gateway umieść ją w `~/.openclaw/.env`.
    Zobacz [Zmienne środowiskowe](/pl/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parametry narzędzia

| Parametr              | Opis                                                  |
| --------------------- | ----------------------------------------------------- |
| `query`               | Zapytanie wyszukiwania (wymagane)                     |
| `count`               | Wyniki do zwrócenia (1-10, domyślnie: 5)              |
| `country`             | 2-literowy kod kraju ISO (np. "US", "DE")             |
| `language`            | Kod języka ISO 639-1 (np. "en", "de")                 |
| `search_lang`         | Kod języka wyszukiwania (tylko Brave)                 |
| `freshness`           | Filtr czasu: `day`, `week`, `month` albo `year`       |
| `date_after`          | Wyniki po tej dacie (YYYY-MM-DD)                      |
| `date_before`         | Wyniki przed tą datą (YYYY-MM-DD)                     |
| `ui_lang`             | Kod języka interfejsu użytkownika (tylko Brave)       |
| `domain_filter`       | Tablica listy dozwolonych/zablokowanych domen (tylko Perplexity) |
| `max_tokens`          | Łączny budżet treści, domyślnie 25000 (tylko Perplexity) |
| `max_tokens_per_page` | Limit tokenów na stronę, domyślnie 2048 (tylko Perplexity) |

<Warning>
  Nie wszystkie parametry działają ze wszystkimi dostawcami. Tryb Brave `llm-context`
  odrzuca `ui_lang`; `date_before` wymaga także `date_after`, ponieważ niestandardowe
  zakresy świeżości Brave wymagają zarówno daty początkowej, jak i końcowej.
  Gemini, Grok i Kimi zwracają jedną syntetyzowaną odpowiedź z cytowaniami. Akceptują
  `count` dla zgodności ze współdzielonym narzędziem, ale nie zmienia to kształtu
  ugruntowanej odpowiedzi. Gemini obsługuje `freshness`, `date_after` i
  `date_before`, konwertując je na zakresy czasu ugruntowania Google Search.
  Perplexity zachowuje się tak samo, gdy używasz ścieżki zgodności Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` albo `OPENROUTER_API_KEY`).
  SearXNG akceptuje `http://` tylko dla zaufanych hostów sieci prywatnej albo local loopback;
  publiczne punkty końcowe SearXNG muszą używać `https://`.
  Firecrawl i Tavily obsługują przez `web_search` tylko `query` i `count`
  -- do opcji zaawansowanych używaj ich dedykowanych narzędzi.
</Warning>

## x_search

`x_search` odpytuje wpisy X (dawniej Twitter) przy użyciu xAI i zwraca
odpowiedzi syntetyzowane przez AI z cytowaniami. Akceptuje zapytania w języku
naturalnym i opcjonalne filtry strukturalne. OpenClaw włącza wbudowane narzędzie
xAI `x_search` tylko w żądaniu, które obsługuje to wywołanie narzędzia.

<Note>
  Dokumentacja xAI opisuje `x_search` jako obsługujące wyszukiwanie słów kluczowych, wyszukiwanie semantyczne, wyszukiwanie użytkowników i pobieranie wątków. W przypadku statystyk zaangażowania dla pojedynczego wpisu, takich jak reposty,
  odpowiedzi, zakładki albo wyświetlenia, preferuj ukierunkowane wyszukiwanie dokładnego adresu URL wpisu
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
            baseUrl: "https://api.x.ai/v1", // optional, overrides webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`x_search` wysyła żądania do `<baseUrl>/responses`, gdy ustawione jest
`plugins.entries.xai.config.xSearch.baseUrl`. Jeśli to pole zostanie pominięte,
używa zapasowo `plugins.entries.xai.config.webSearch.baseUrl`, następnie
starszego `tools.web.search.grok.baseUrl`, a na końcu publicznego punktu końcowego xAI.

### Parametry x_search

| Parametr                     | Opis                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Zapytanie wyszukiwania (wymagane)                      |
| `allowed_x_handles`          | Ogranicz wyniki do określonych uchwytów X              |
| `excluded_x_handles`         | Wyklucz określone uchwyty X                            |
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

Jeśli używasz profili narzędzi albo list dozwolonych, dodaj `web_search`, `x_search` albo `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Powiązane

- [Web Fetch](/pl/tools/web-fetch) -- pobiera URL i wyodrębnia czytelną treść
- [Web Browser](/pl/tools/browser) -- pełna automatyzacja przeglądarki dla stron intensywnie korzystających z JS
- [Grok Search](/pl/tools/grok-search) -- Grok jako dostawca `web_search`
- [Ollama Web Search](/pl/tools/ollama-search) -- wyszukiwanie w sieci bez klucza przez host Ollama
