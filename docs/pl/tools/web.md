---
read_when:
    - Chcesz włączyć lub skonfigurować web_search
    - Chcesz włączyć lub skonfigurować x_search
    - Musisz wybrać dostawcę wyszukiwania
    - Chcesz zrozumieć automatyczne wykrywanie i fallback dostawców
sidebarTitle: Web Search
summary: web_search, x_search i web_fetch — przeszukuj sieć, wyszukuj posty na X lub pobieraj treść strony
title: Web Search
x-i18n:
    generated_at: "2026-04-05T14:10:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8b9a5d641dcdcbe7c099c8862898f12646f43151b6c4152d69c26af9b17e0fa
    source_path: tools/web.md
    workflow: 15
---

# Web Search

Narzędzie `web_search` przeszukuje sieć przy użyciu skonfigurowanego dostawcy i
zwraca wyniki. Wyniki są przechowywane w cache według zapytania przez 15 minut (konfigurowalne).

OpenClaw zawiera także `x_search` do wyszukiwania postów na X (dawniej Twitter) oraz
`web_fetch` do lekkiego pobierania URL-i. Na tym etapie `web_fetch` pozostaje
lokalne, podczas gdy `web_search` i `x_search` mogą pod spodem używać xAI Responses.

<Info>
  `web_search` to lekkie narzędzie HTTP, a nie automatyzacja przeglądarki. W przypadku
  stron intensywnie korzystających z JS lub wymagających logowania użyj [Web Browser](/tools/browser). Do
  pobrania konkretnego URL-a użyj [Web Fetch](/tools/web-fetch).
</Info>

## Szybki start

<Steps>
  <Step title="Wybierz dostawcę">
    Wybierz dostawcę i wykonaj wymaganą konfigurację. Niektórzy dostawcy są
    bezkluczowi, podczas gdy inni używają kluczy API. Szczegóły znajdziesz
    na stronach dostawców poniżej.
  </Step>
  <Step title="Skonfiguruj">
    ```bash
    openclaw configure --section web
    ```
    To zapisuje dostawcę i wszelkie potrzebne poświadczenia. Możesz też ustawić zmienną środowiskową
    (na przykład `BRAVE_API_KEY`) i pominąć ten krok dla
    dostawców opartych na API.
  </Step>
  <Step title="Użyj">
    Agent może teraz wywoływać `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Dla postów X użyj:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Wybór dostawcy

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/tools/brave-search">
    Ustrukturyzowane wyniki z fragmentami. Obsługuje tryb `llm-context`, filtry kraju/języka. Dostępny darmowy plan.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/tools/duckduckgo-search">
    Bezkluczowy fallback. Nie wymaga klucza API. Nieoficjalna integracja oparta na HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/tools/exa-search">
    Wyszukiwanie neuronowe + słowami kluczowymi z ekstrakcją treści (wyróżnienia, tekst, podsumowania).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/tools/firecrawl">
    Ustrukturyzowane wyniki. Najlepiej łączyć z `firecrawl_search` i `firecrawl_scrape` do głębokiej ekstrakcji.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/tools/gemini-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami dzięki ugruntowaniu w Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/tools/grok-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami dzięki ugruntowaniu webowemu xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/tools/kimi-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami przez wyszukiwanie webowe Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/tools/minimax-search">
    Ustrukturyzowane wyniki przez API wyszukiwania MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/tools/ollama-search">
    Wyszukiwanie bez klucza przez skonfigurowany host Ollama. Wymaga `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/tools/perplexity-search">
    Ustrukturyzowane wyniki z kontrolą ekstrakcji treści i filtrowaniem domen.
  </Card>
  <Card title="SearXNG" icon="server" href="/tools/searxng-search">
    Samodzielnie hostowane metawyszukiwanie. Nie wymaga klucza API. Agreguje Google, Bing, DuckDuckGo i inne.
  </Card>
  <Card title="Tavily" icon="globe" href="/tools/tavily">
    Ustrukturyzowane wyniki z głębokością wyszukiwania, filtrowaniem tematów i `tavily_extract` do ekstrakcji URL-i.
  </Card>
</CardGroup>

### Porównanie dostawców

| Dostawca                                  | Styl wyników                | Filtry                                           | Klucz API                                                                         |
| ----------------------------------------- | --------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| [Brave](/tools/brave-search)              | Ustrukturyzowane fragmenty  | Kraj, język, czas, tryb `llm-context`            | `BRAVE_API_KEY`                                                                   |
| [DuckDuckGo](/tools/duckduckgo-search)    | Ustrukturyzowane fragmenty  | --                                               | Brak (bez klucza)                                                                 |
| [Exa](/tools/exa-search)                  | Ustrukturyzowane + wyekstrahowane | Tryb neuronowy/słów kluczowych, data, ekstrakcja treści | `EXA_API_KEY`                                                             |
| [Firecrawl](/tools/firecrawl)             | Ustrukturyzowane fragmenty  | Przez narzędzie `firecrawl_search`               | `FIRECRAWL_API_KEY`                                                               |
| [Gemini](/tools/gemini-search)            | Syntetyzowane przez AI + cytowania | --                                          | `GEMINI_API_KEY`                                                                  |
| [Grok](/tools/grok-search)                | Syntetyzowane przez AI + cytowania | --                                          | `XAI_API_KEY`                                                                     |
| [Kimi](/tools/kimi-search)                | Syntetyzowane przez AI + cytowania | --                                          | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                               |
| [MiniMax Search](/tools/minimax-search)   | Ustrukturyzowane fragmenty  | Region (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                |
| [Ollama Web Search](/tools/ollama-search) | Ustrukturyzowane fragmenty  | --                                               | Domyślnie brak; wymagane `ollama signin`, może ponownie używać bearer auth dostawcy Ollama |
| [Perplexity](/tools/perplexity-search)    | Ustrukturyzowane fragmenty  | Kraj, język, czas, domeny, limity treści         | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                       |
| [SearXNG](/tools/searxng-search)          | Ustrukturyzowane fragmenty  | Kategorie, język                                 | Brak (self-hosted)                                                                |
| [Tavily](/tools/tavily)                   | Ustrukturyzowane fragmenty  | Przez narzędzie `tavily_search`                  | `TAVILY_API_KEY`                                                                  |

## Automatyczne wykrywanie

## Natywne wyszukiwanie webowe Codex

Modele obsługujące Codex mogą opcjonalnie używać natywnego narzędzia `web_search` z Responses dostawcy zamiast zarządzanej funkcji `web_search` OpenClaw.

- Skonfiguruj to pod `tools.web.search.openaiCodex`
- Aktywuje się tylko dla modeli obsługujących Codex (`openai-codex/*` lub dostawców używających `api: "openai-codex-responses"`)
- Zarządzane `web_search` nadal ma zastosowanie do modeli nieobsługujących Codex
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

Jeśli natywne wyszukiwanie Codex jest włączone, ale bieżący model nie obsługuje Codex, OpenClaw zachowuje zwykłe zarządzane `web_search`.

## Konfigurowanie web search

Listy dostawców w dokumentacji i przepływach konfiguracji są ułożone alfabetycznie. Automatyczne wykrywanie zachowuje
osobną kolejność priorytetów.

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

Następnie bezkluczowe fallbacki:

10. **DuckDuckGo** -- bezkluczowy fallback HTML bez konta i klucza API (kolejność 100)
11. **Ollama Web Search** -- bezkluczowy fallback przez skonfigurowany host Ollama; wymaga, aby Ollama była osiągalna i zalogowana przez `ollama signin`, i może ponownie używać bearer auth dostawcy Ollama, jeśli host tego wymaga (kolejność 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` lub `plugins.entries.searxng.config.webSearch.baseUrl` (kolejność 200)

Jeśli nie zostanie wykryty żaden dostawca, następuje fallback do Brave (otrzymasz błąd
brakującego klucza z prośbą o jego skonfigurowanie).

<Note>
  Wszystkie pola kluczy dostawców obsługują obiekty SecretRef. W trybie automatycznego wykrywania
  OpenClaw rozwiązuje tylko klucz wybranego dostawcy — SecretRefy niewybrane
  pozostają nieaktywne.
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

Konfiguracja specyficzna dla dostawcy (klucze API, base URL, tryby) znajduje się pod
`plugins.entries.<plugin>.config.webSearch.*`. Przykłady znajdziesz
na stronach poszczególnych dostawców.

Wybór dostawcy fallback dla `web_fetch` jest osobny:

- wybierz go przez `tools.web.fetch.provider`
- albo pomiń to pole i pozwól OpenClaw automatycznie wykryć pierwszego gotowego dostawcę `web-fetch`
  na podstawie dostępnych poświadczeń
- obecnie dołączonym dostawcą `web-fetch` jest Firecrawl, konfigurowany pod
  `plugins.entries.firecrawl.config.webFetch.*`

Gdy wybierzesz **Kimi** podczas `openclaw onboard` lub
`openclaw configure --section web`, OpenClaw może też zapytać o:

- region API Moonshot (`https://api.moonshot.ai/v1` lub `https://api.moonshot.cn/v1`)
- domyślny model wyszukiwania webowego Kimi (domyślnie `kimi-k2.5`)

Dla `x_search` skonfiguruj `plugins.entries.xai.config.xSearch.*`. Używa ono
tego samego fallbacku `XAI_API_KEY` co wyszukiwanie webowe Grok.
Starsza konfiguracja `tools.web.x_search.*` jest automatycznie migrowana przez `openclaw doctor --fix`.
Gdy wybierzesz Grok podczas `openclaw onboard` lub `openclaw configure --section web`,
OpenClaw może też zaoferować opcjonalną konfigurację `x_search` z tym samym kluczem.
Jest to osobny krok uzupełniający wewnątrz ścieżki Grok, a nie oddzielny wybór
dostawcy web-search na najwyższym poziomie. Jeśli wybierzesz innego dostawcę, OpenClaw nie
pokaże promptu `x_search`.

### Przechowywanie kluczy API

<Tabs>
  <Tab title="Plik konfiguracyjny">
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

    Dla instalacji gateway umieść ją w `~/.openclaw/.env`.
    Zobacz [Zmienne środowiskowe](/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parametry narzędzia

| Parametr              | Opis                                                      |
| --------------------- | --------------------------------------------------------- |
| `query`               | Zapytanie wyszukiwania (wymagane)                         |
| `count`               | Liczba wyników do zwrócenia (1-10, domyślnie: 5)          |
| `country`             | 2-literowy kod kraju ISO (np. `"US"`, `"DE"`)            |
| `language`            | Kod języka ISO 639-1 (np. `"en"`, `"de"`)                |
| `search_lang`         | Kod języka wyszukiwania (tylko Brave)                    |
| `freshness`           | Filtr czasu: `day`, `week`, `month` lub `year`           |
| `date_after`          | Wyniki po tej dacie (YYYY-MM-DD)                         |
| `date_before`         | Wyniki przed tą datą (YYYY-MM-DD)                        |
| `ui_lang`             | Kod języka interfejsu (tylko Brave)                      |
| `domain_filter`       | Tablica allowlisty/denylisty domen (tylko Perplexity)    |
| `max_tokens`          | Całkowity budżet treści, domyślnie 25000 (tylko Perplexity) |
| `max_tokens_per_page` | Limit tokenów na stronę, domyślnie 2048 (tylko Perplexity) |

<Warning>
  Nie wszystkie parametry działają ze wszystkimi dostawcami. Tryb Brave `llm-context`
  odrzuca `ui_lang`, `freshness`, `date_after` i `date_before`.
  Gemini, Grok i Kimi zwracają jedną odpowiedź syntetyzowaną z cytowaniami. Akceptują
  `count` dla zgodności współdzielonego narzędzia, ale nie zmienia to kształtu
  ugruntowanej odpowiedzi.
  Perplexity zachowuje się tak samo, gdy używasz ścieżki zgodności Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` lub `OPENROUTER_API_KEY`).
  SearXNG akceptuje `http://` tylko dla zaufanych hostów sieci prywatnej lub loopback;
  publiczne endpointy SearXNG muszą używać `https://`.
  Firecrawl i Tavily obsługują przez `web_search` tylko `query` i `count`
  — używaj ich dedykowanych narzędzi dla opcji zaawansowanych.
</Warning>

## x_search

`x_search` wyszukuje posty na X (dawniej Twitter) przy użyciu xAI i zwraca
odpowiedzi syntetyzowane przez AI z cytowaniami. Akceptuje zapytania w języku naturalnym oraz
opcjonalne ustrukturyzowane filtry. OpenClaw włącza wbudowane narzędzie `x_search` xAI tylko w żądaniu obsługującym to wywołanie narzędzia.

<Note>
  xAI dokumentuje `x_search` jako obsługujące wyszukiwanie słów kluczowych, wyszukiwanie semantyczne, wyszukiwanie użytkowników
  oraz pobieranie wątków. W przypadku statystyk zaangażowania dla konkretnego posta, takich jak reposty,
  odpowiedzi, zakładki lub wyświetlenia, preferuj ukierunkowane wyszukiwanie dokładnego URL-a posta
  lub ID statusu. Szerokie wyszukiwania słów kluczowych mogą znaleźć właściwy post, ale zwrócić mniej
  kompletnych metadanych dla pojedynczego posta. Dobry wzorzec to: najpierw zlokalizować post, a potem
  uruchomić drugie zapytanie `x_search` skupione dokładnie na tym poście.
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
| `allowed_x_handles`          | Ogranicza wyniki do określonych handle’i X               |
| `excluded_x_handles`         | Wyklucza określone handle X                              |
| `from_date`                  | Uwzględnia tylko posty z tej daty lub późniejsze (YYYY-MM-DD) |
| `to_date`                    | Uwzględnia tylko posty z tej daty lub wcześniejsze (YYYY-MM-DD) |
| `enable_image_understanding` | Pozwala xAI analizować obrazy dołączone do pasujących postów |
| `enable_video_understanding` | Pozwala xAI analizować wideo dołączone do pasujących postów |

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

Jeśli używasz profili narzędzi lub allowlist, dodaj `web_search`, `x_search` albo `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Powiązane

- [Web Fetch](/tools/web-fetch) -- pobieranie URL-a i wyodrębnianie czytelnej treści
- [Web Browser](/tools/browser) -- pełna automatyzacja przeglądarki dla stron intensywnie korzystających z JS
- [Grok Search](/tools/grok-search) -- Grok jako dostawca `web_search`
- [Ollama Web Search](/tools/ollama-search) -- wyszukiwanie webowe bez klucza przez host Ollama
