---
read_when:
    - Chcesz włączyć lub skonfigurować web_search
    - Chcesz włączyć lub skonfigurować x_search
    - Musisz wybrać dostawcę wyszukiwania
    - Chcesz zrozumieć automatyczne wykrywanie i awaryjne przełączanie dostawcy
sidebarTitle: Web Search
summary: web_search, x_search i web_fetch -- przeszukaj sieć, przeszukaj posty X lub pobierz zawartość strony
title: Wyszukiwanie w sieci
x-i18n:
    generated_at: "2026-05-07T13:27:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84de67b51f02e3b901bfa55017ae8e88de49295dfe6ed1103a45f034e073c087
    source_path: tools/web.md
    workflow: 16
---

Narzędzie `web_search` przeszukuje WWW przy użyciu skonfigurowanego dostawcy i
zwraca wyniki. Wyniki są buforowane według zapytania przez 15 minut (konfigurowalne).

OpenClaw zawiera także `x_search` dla wpisów z X (dawniej Twitter) oraz
`web_fetch` do lekkiego pobierania adresów URL. W tej fazie `web_fetch` pozostaje
lokalne, a `web_search` i `x_search` mogą pod spodem używać xAI Responses.

<Info>
  `web_search` to lekkie narzędzie HTTP, a nie automatyzacja przeglądarki. W przypadku
  stron intensywnie korzystających z JS lub logowania użyj [przeglądarki WWW](/pl/tools/browser). Do
  pobierania konkretnego adresu URL użyj [Web Fetch](/pl/tools/web-fetch).
</Info>

## Szybki start

<Steps>
  <Step title="Choose a provider">
    Wybierz dostawcę i wykonaj wymaganą konfigurację. Niektórzy dostawcy nie
    wymagają klucza, a inni używają kluczy API. Szczegóły znajdziesz na stronach
    dostawców poniżej.
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    Zapisuje to dostawcę i wszelkie potrzebne dane uwierzytelniające. Możesz także ustawić zmienną
    środowiskową (na przykład `BRAVE_API_KEY`) i pominąć ten krok dla dostawców
    opartych na API.
  </Step>
  <Step title="Use it">
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
    Wyniki strukturalne z fragmentami. Obsługuje tryb `llm-context` oraz filtry kraju/języka. Dostępna warstwa bezpłatna.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/pl/tools/duckduckgo-search">
    Fallback bez klucza. Klucz API nie jest potrzebny. Nieoficjalna integracja oparta na HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/pl/tools/exa-search">
    Wyszukiwanie neuronowe i słownikowe z ekstrakcją treści (wyróżnienia, tekst, podsumowania).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/pl/tools/firecrawl">
    Wyniki strukturalne. Najlepiej łączyć z `firecrawl_search` i `firecrawl_scrape` do głębokiej ekstrakcji.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/pl/tools/gemini-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami przez ugruntowanie w Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/pl/tools/grok-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami przez ugruntowanie w WWW xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/pl/tools/kimi-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami przez wyszukiwanie WWW Moonshot; nieugruntowane fallbacki czatu jawnie kończą się niepowodzeniem.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/pl/tools/minimax-search">
    Wyniki strukturalne przez API wyszukiwania MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/pl/tools/ollama-search">
    Wyszukiwanie przez zalogowanego lokalnego hosta Ollama lub hostowane API Ollama.
  </Card>
  <Card title="Perplexity" icon="search" href="/pl/tools/perplexity-search">
    Wyniki strukturalne z kontrolą ekstrakcji treści i filtrowaniem domen.
  </Card>
  <Card title="SearXNG" icon="server" href="/pl/tools/searxng-search">
    Samodzielnie hostowane metawyszukiwanie. Klucz API nie jest potrzebny. Agreguje Google, Bing, DuckDuckGo i inne.
  </Card>
  <Card title="Tavily" icon="globe" href="/pl/tools/tavily">
    Wyniki strukturalne z głębokością wyszukiwania, filtrowaniem tematów oraz `tavily_extract` do ekstrakcji adresów URL.
  </Card>
</CardGroup>

### Porównanie dostawców

| Dostawca                                  | Styl wyników                                                   | Filtry                                           | Klucz API                                                                               |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/pl/tools/brave-search)              | Strukturalne fragmenty                                         | Kraj, język, czas, tryb `llm-context`            | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/pl/tools/duckduckgo-search)    | Strukturalne fragmenty                                         | --                                               | Brak (bez klucza)                                                                       |
| [Exa](/pl/tools/exa-search)                  | Strukturalne + wyekstrahowane                                  | Tryb neuronowy/słownikowy, data, ekstrakcja treści | `EXA_API_KEY`                                                                           |
| [Firecrawl](/pl/tools/firecrawl)             | Strukturalne fragmenty                                         | Przez narzędzie `firecrawl_search`               | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/pl/tools/gemini-search)            | Syntetyzowane przez AI + cytowania                             | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/pl/tools/grok-search)                | Syntetyzowane przez AI + cytowania                             | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/pl/tools/kimi-search)                | Syntetyzowane przez AI + cytowania; kończy się niepowodzeniem przy nieugruntowanych fallbackach czatu | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/pl/tools/minimax-search)   | Strukturalne fragmenty                                         | Region (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/pl/tools/ollama-search) | Strukturalne fragmenty                                         | --                                               | Brak dla zalogowanych lokalnych hostów; `OLLAMA_API_KEY` dla bezpośredniego wyszukiwania `https://ollama.com` |
| [Perplexity](/pl/tools/perplexity-search)    | Strukturalne fragmenty                                         | Kraj, język, czas, domeny, limity treści         | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/pl/tools/searxng-search)          | Strukturalne fragmenty                                         | Kategorie, język                                 | Brak (samodzielnie hostowane)                                                           |
| [Tavily](/pl/tools/tavily)                   | Strukturalne fragmenty                                         | Przez narzędzie `tavily_search`                  | `TAVILY_API_KEY`                                                                        |

## Automatyczne wykrywanie

## Natywne wyszukiwanie WWW OpenAI

Modele OpenAI Responses używane bezpośrednio automatycznie korzystają z hostowanego przez OpenAI narzędzia `web_search`, gdy wyszukiwanie WWW OpenClaw jest włączone i nie przypięto żadnego zarządzanego dostawcy. Jest to zachowanie należące do dostawcy w dołączonym Plugin OpenAI i dotyczy wyłącznie natywnego ruchu API OpenAI, a nie bazowych adresów URL proxy zgodnych z OpenAI ani tras Azure. Ustaw `tools.web.search.provider` na innego dostawcę, takiego jak `brave`, aby zachować zarządzane narzędzie `web_search` dla modeli OpenAI, albo ustaw `tools.web.search.enabled: false`, aby wyłączyć zarówno zarządzane wyszukiwanie, jak i natywne wyszukiwanie OpenAI.

## Natywne wyszukiwanie WWW Codex

Modele obsługujące Codex mogą opcjonalnie używać natywnego dla dostawcy narzędzia Responses `web_search` zamiast zarządzanej funkcji OpenClaw `web_search`.

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

Jeśli natywne wyszukiwanie Codex jest włączone, ale bieżący model nie obsługuje Codex, OpenClaw zachowuje normalne, zarządzane działanie `web_search`.

## Bezpieczeństwo sieci

Wywołania zarządzanego dostawcy `web_search` używają chronionej ścieżki pobierania OpenClaw. Dla
zaufanych hostów API dostawców OpenClaw zezwala na odpowiedzi DNS fake-IP
Surge, Clash i sing-box w `198.18.0.0/15` oraz `fc00::/7` tylko dla tej nazwy hosta dostawcy.
Inne prywatne miejsca docelowe, loopback, link-local i metadane pozostają zablokowane.

To automatyczne zezwolenie nie dotyczy dowolnych adresów URL `web_fetch`. W przypadku
`web_fetch` włączaj `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` i
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` jawnie tylko wtedy, gdy Twój
zaufany proxy jest właścicielem tych syntetycznych zakresów.

## Konfigurowanie wyszukiwania WWW

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

Następnie fallbacki bez klucza:

10. **DuckDuckGo** -- fallback HTML bez klucza, bez konta ani klucza API (kolejność 100)
11. **Ollama Web Search** -- fallback bez klucza przez skonfigurowanego lokalnego hosta Ollama, gdy jest osiągalny i zalogowany za pomocą `ollama signin`; może ponownie używać uwierzytelniania bearer dostawcy Ollama, gdy host go wymaga, i może wywoływać bezpośrednie wyszukiwanie `https://ollama.com`, gdy skonfigurowano `OLLAMA_API_KEY` (kolejność 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` lub `plugins.entries.searxng.config.webSearch.baseUrl` (kolejność 200)

Jeśli nie wykryto żadnego dostawcy, następuje fallback do Brave (otrzymasz błąd brakującego klucza
z prośbą o skonfigurowanie go).

<Note>
  Wszystkie pola kluczy dostawców obsługują obiekty SecretRef. SecretRef o zakresie Plugin
  pod `plugins.entries.<plugin>.config.webSearch.apiKey` są rozwiązywane dla
  dołączonych dostawców wyszukiwania WWW opartych na API, w tym Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity i Tavily,
  niezależnie od tego, czy dostawca został wybrany jawnie przez `tools.web.search.provider`, czy
  wybrany przez automatyczne wykrywanie. W trybie automatycznego wykrywania OpenClaw rozwiązuje tylko
  klucz wybranego dostawcy -- niewybrane SecretRef pozostają nieaktywne, więc możesz
  mieć skonfigurowanych wielu dostawców bez ponoszenia kosztu rozwiązywania dla tych,
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
`plugins.entries.<plugin>.config.webSearch.*`. Gemini może również ponownie używać
`models.providers.google.apiKey` i `models.providers.google.baseUrl` jako zapasów o niższym priorytecie
po swojej dedykowanej konfiguracji wyszukiwania w sieci i `GEMINI_API_KEY`. Przykłady znajdziesz na
stronach dostawców.

`tools.web.search.provider` jest sprawdzane względem identyfikatorów dostawców wyszukiwania w sieci
zadeklarowanych przez manifesty dołączonych i zainstalowanych Plugin. Literówka taka jak `"brvae"`
powoduje błąd walidacji konfiguracji zamiast cicho przełączać się na automatyczne wykrywanie. Jeśli
skonfigurowany dostawca ma tylko nieaktualne ślady Plugin, na przykład pozostały blok
`plugins.entries.<plugin>` po odinstalowaniu zewnętrznego Plugin,
OpenClaw zachowuje odporne uruchamianie i zgłasza ostrzeżenie, aby można było ponownie zainstalować
Plugin albo uruchomić `openclaw doctor --fix` w celu wyczyszczenia nieaktualnej konfiguracji.

Wybór dostawcy zapasowego `web_fetch` jest oddzielny:

- wybierz go za pomocą `tools.web.fetch.provider`
- albo pomiń to pole i pozwól OpenClaw automatycznie wykryć pierwszego gotowego dostawcę web-fetch
  na podstawie dostępnych poświadczeń
- `web_fetch` poza sandboxem może używać zainstalowanych dostawców Plugin, którzy deklarują
  `contracts.webFetchProviders`; pobierania w sandboxie pozostają tylko dołączone
- obecnie dołączonym dostawcą web-fetch jest Firecrawl, konfigurowany pod
  `plugins.entries.firecrawl.config.webFetch.*`

Gdy wybierzesz **Kimi** podczas `openclaw onboard` lub
`openclaw configure --section web`, OpenClaw może również poprosić o:

- region API Moonshot (`https://api.moonshot.ai/v1` lub `https://api.moonshot.cn/v1`)
- domyślny model wyszukiwania w sieci Kimi (domyślnie `kimi-k2.6`)

Dla `x_search` skonfiguruj `plugins.entries.xai.config.xSearch.*`. Używa tego samego
zapasu `XAI_API_KEY` co wyszukiwanie w sieci Grok.
Starsza konfiguracja `tools.web.x_search.*` jest automatycznie migrowana przez `openclaw doctor --fix`.
Gdy wybierzesz Grok podczas `openclaw onboard` lub `openclaw configure --section web`,
OpenClaw może również zaproponować opcjonalną konfigurację `x_search` z tym samym kluczem.
To oddzielny kolejny krok w ścieżce Grok, a nie osobny wybór dostawcy wyszukiwania w sieci
najwyższego poziomu. Jeśli wybierzesz innego dostawcę, OpenClaw nie pokaże monitu `x_search`.

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
    Ustaw zmienną środowiskową dostawcy w środowisku procesu Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    W przypadku instalacji gateway umieść ją w `~/.openclaw/.env`.
    Zobacz [zmienne środowiskowe](/pl/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parametry narzędzia

| Parametr              | Opis                                                           |
| --------------------- | -------------------------------------------------------------- |
| `query`               | Zapytanie wyszukiwania (wymagane)                              |
| `count`               | Liczba wyników do zwrócenia (1-10, domyślnie: 5)               |
| `country`             | 2-literowy kod kraju ISO (np. "US", "DE")                      |
| `language`            | Kod języka ISO 639-1 (np. "en", "de")                         |
| `search_lang`         | Kod języka wyszukiwania (tylko Brave)                          |
| `freshness`           | Filtr czasu: `day`, `week`, `month` albo `year`                |
| `date_after`          | Wyniki po tej dacie (YYYY-MM-DD)                               |
| `date_before`         | Wyniki przed tą datą (YYYY-MM-DD)                              |
| `ui_lang`             | Kod języka UI (tylko Brave)                                    |
| `domain_filter`       | Tablica listy dozwolonych/zablokowanych domen (tylko Perplexity) |
| `max_tokens`          | Łączny budżet treści, domyślnie 25000 (tylko Perplexity)       |
| `max_tokens_per_page` | Limit tokenów na stronę, domyślnie 2048 (tylko Perplexity)     |

<Warning>
  Nie wszystkie parametry działają ze wszystkimi dostawcami. Tryb Brave `llm-context`
  odrzuca `ui_lang`; `date_before` wymaga również `date_after`, ponieważ niestandardowe
  zakresy świeżości Brave wymagają zarówno daty początkowej, jak i końcowej.
  Gemini, Grok i Kimi zwracają jedną zsyntetyzowaną odpowiedź z cytowaniami. Akceptują
  `count` dla zgodności ze współdzielonym narzędziem, ale nie zmienia to kształtu
  ugruntowanej odpowiedzi. Gemini obsługuje `freshness`, `date_after` i
  `date_before`, konwertując je na zakresy czasu ugruntowania Google Search.
  Perplexity zachowuje się tak samo, gdy używasz ścieżki zgodności Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` albo `OPENROUTER_API_KEY`).
  SearXNG akceptuje `http://` tylko dla zaufanych hostów w sieci prywatnej lub local loopback;
  publiczne punkty końcowe SearXNG muszą używać `https://`.
  Firecrawl i Tavily obsługują tylko `query` i `count` przez `web_search`
  -- dla zaawansowanych opcji użyj ich dedykowanych narzędzi.
</Warning>

## x_search

`x_search` odpytuje wpisy X (dawniej Twitter) za pomocą xAI i zwraca
odpowiedzi zsyntetyzowane przez AI z cytowaniami. Akceptuje zapytania w języku naturalnym oraz
opcjonalne filtry strukturalne. OpenClaw włącza wbudowane narzędzie xAI `x_search`
tylko dla żądania obsługującego to wywołanie narzędzia.

<Note>
  xAI dokumentuje `x_search` jako obsługujące wyszukiwanie po słowach kluczowych, wyszukiwanie semantyczne, wyszukiwanie użytkowników
  i pobieranie wątków. W przypadku statystyk zaangażowania dla pojedynczych wpisów, takich jak reposty,
  odpowiedzi, zakładki czy wyświetlenia, preferuj ukierunkowane wyszukiwanie dokładnego adresu URL wpisu
  lub identyfikatora statusu. Szerokie wyszukiwania po słowach kluczowych mogą znaleźć właściwy wpis, ale zwrócić mniej
  kompletne metadane dla pojedynczego wpisu. Dobry wzorzec to: najpierw zlokalizuj wpis, a potem
  uruchom drugie zapytanie `x_search` skupione na tym konkretnym wpisie.
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

`x_search` wysyła wpisy do `<baseUrl>/responses`, gdy
`plugins.entries.xai.config.xSearch.baseUrl` jest ustawione. Jeśli to pole zostanie pominięte,
wraca do `plugins.entries.xai.config.webSearch.baseUrl`, następnie do
starszego `tools.web.search.grok.baseUrl`, a na końcu do publicznego punktu końcowego xAI.

### Parametry x_search

| Parametr                     | Opis                                                        |
| ---------------------------- | ----------------------------------------------------------- |
| `query`                      | Zapytanie wyszukiwania (wymagane)                           |
| `allowed_x_handles`          | Ogranicz wyniki do określonych nazw użytkowników X          |
| `excluded_x_handles`         | Wyklucz określone nazwy użytkowników X                      |
| `from_date`                  | Uwzględnij tylko wpisy z tej daty lub późniejsze (YYYY-MM-DD) |
| `to_date`                    | Uwzględnij tylko wpisy z tej daty lub wcześniejsze (YYYY-MM-DD) |
| `enable_image_understanding` | Pozwól xAI analizować obrazy dołączone do pasujących wpisów |
| `enable_video_understanding` | Pozwól xAI analizować filmy dołączone do pasujących wpisów  |

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

- [Pobieranie z sieci](/pl/tools/web-fetch) -- pobierz URL i wyodrębnij czytelną treść
- [Przeglądarka internetowa](/pl/tools/browser) -- pełna automatyzacja przeglądarki dla witryn intensywnie korzystających z JS
- [Wyszukiwanie Grok](/pl/tools/grok-search) -- Grok jako dostawca `web_search`
- [Wyszukiwanie internetowe Ollama](/pl/tools/ollama-search) -- wyszukiwanie w sieci bez klucza przez hosta Ollama
