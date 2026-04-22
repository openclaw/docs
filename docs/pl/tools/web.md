---
read_when:
    - Chcesz włączyć lub skonfigurować `web_search`
    - Chcesz włączyć lub skonfigurować `x_search`
    - Musisz wybrać providera wyszukiwania
    - Chcesz zrozumieć automatyczne wykrywanie i fallback providera
sidebarTitle: Web Search
summary: '`web_search`, `x_search` i `web_fetch` — przeszukuj sieć, przeszukuj posty na X lub pobieraj treść strony'
title: Wyszukiwanie w sieci
x-i18n:
    generated_at: "2026-04-22T04:29:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec2517d660465f850b1cfdd255fbf512dc5c828b1ef22e3b24cec6aab097ebd5
    source_path: tools/web.md
    workflow: 15
---

# Wyszukiwanie w sieci

Narzędzie `web_search` przeszukuje sieć przy użyciu skonfigurowanego providera i
zwraca wyniki. Wyniki są cache'owane według zapytania przez 15 minut (konfigurowalne).

OpenClaw zawiera również `x_search` dla postów na X (dawniej Twitter) oraz
`web_fetch` do lekkiego pobierania URL-i. W tej fazie `web_fetch` pozostaje
lokalne, podczas gdy `web_search` i `x_search` mogą pod spodem używać xAI Responses.

<Info>
  `web_search` to lekkie narzędzie HTTP, a nie automatyzacja przeglądarki. Dla
  stron intensywnie używających JS lub wymagających logowania użyj [Web Browser](/pl/tools/browser). Do
  pobrania konkretnego URL-a użyj [Web Fetch](/pl/tools/web-fetch).
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
    To zapisuje providera i potrzebne poświadczenie. Możesz też ustawić zmienną env
    (na przykład `BRAVE_API_KEY`) i pominąć ten krok dla providerów
    opartych na API.
  </Step>
  <Step title="Użyj">
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
    Strukturyzowane wyniki ze snippetami. Obsługuje tryb `llm-context`, filtry kraju/języka. Dostępna darmowa warstwa.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/pl/tools/duckduckgo-search">
    Bezkluczowy fallback. Nie wymaga klucza API. Nieoficjalna integracja oparta na HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/pl/tools/exa-search">
    Wyszukiwanie neuronowe + słowami kluczowymi z ekstrakcją treści (highlighty, tekst, podsumowania).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/pl/tools/firecrawl">
    Strukturyzowane wyniki. Najlepiej działa w połączeniu z `firecrawl_search` i `firecrawl_scrape` do głębokiej ekstrakcji.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/pl/tools/gemini-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami dzięki osadzeniu w Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/pl/tools/grok-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami dzięki osadzeniu w wyszukiwaniu xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/pl/tools/kimi-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami dzięki wyszukiwaniu webowemu Moonshot.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/pl/tools/minimax-search">
    Strukturyzowane wyniki przez API wyszukiwania MiniMax Coding Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/pl/tools/ollama-search">
    Bezkluczowe wyszukiwanie przez skonfigurowany host Ollama. Wymaga `ollama signin`.
  </Card>
  <Card title="Perplexity" icon="search" href="/pl/tools/perplexity-search">
    Strukturyzowane wyniki z kontrolą ekstrakcji treści i filtrowaniem domen.
  </Card>
  <Card title="SearXNG" icon="server" href="/pl/tools/searxng-search">
    Samohostowane meta-wyszukiwanie. Nie wymaga klucza API. Agreguje Google, Bing, DuckDuckGo i inne.
  </Card>
  <Card title="Tavily" icon="globe" href="/pl/tools/tavily">
    Strukturyzowane wyniki z głębokością wyszukiwania, filtrowaniem tematów i `tavily_extract` do ekstrakcji URL-i.
  </Card>
</CardGroup>

### Porównanie providerów

| Provider                                  | Styl wyników               | Filtry                                           | Klucz API                                                                         |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| [Brave](/pl/tools/brave-search)              | Strukturyzowane snippety   | Kraj, język, czas, tryb `llm-context`            | `BRAVE_API_KEY`                                                                   |
| [DuckDuckGo](/pl/tools/duckduckgo-search)    | Strukturyzowane snippety   | --                                               | Brak (bezkluczowe)                                                                |
| [Exa](/pl/tools/exa-search)                  | Strukturyzowane + wyekstrahowane | Tryb neuronowy/słowa kluczowe, data, ekstrakcja treści | `EXA_API_KEY`                                                             |
| [Firecrawl](/pl/tools/firecrawl)             | Strukturyzowane snippety   | Przez narzędzie `firecrawl_search`               | `FIRECRAWL_API_KEY`                                                               |
| [Gemini](/pl/tools/gemini-search)            | Syntetyzowane przez AI + cytowania | --                                         | `GEMINI_API_KEY`                                                                  |
| [Grok](/pl/tools/grok-search)                | Syntetyzowane przez AI + cytowania | --                                         | `XAI_API_KEY`                                                                     |
| [Kimi](/pl/tools/kimi-search)                | Syntetyzowane przez AI + cytowania | --                                         | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                               |
| [MiniMax Search](/pl/tools/minimax-search)   | Strukturyzowane snippety   | Region (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                |
| [Ollama Web Search](/pl/tools/ollama-search) | Strukturyzowane snippety   | --                                               | Domyślnie brak; wymagane `ollama signin`, może ponownie użyć bearer auth providera Ollama, jeśli host tego wymaga |
| [Perplexity](/pl/tools/perplexity-search)    | Strukturyzowane snippety   | Kraj, język, czas, domeny, limity treści         | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                       |
| [SearXNG](/pl/tools/searxng-search)          | Strukturyzowane snippety   | Kategorie, język                                 | Brak (samohostowane)                                                              |
| [Tavily](/pl/tools/tavily)                   | Strukturyzowane snippety   | Przez narzędzie `tavily_search`                  | `TAVILY_API_KEY`                                                                  |

## Automatyczne wykrywanie

## Natywne wyszukiwanie webowe Codex

Modele obsługujące Codex mogą opcjonalnie używać natywnego narzędzia Responses `web_search` providera zamiast zarządzanej funkcji `web_search` OpenClaw.

- Skonfiguruj je w `tools.web.search.openaiCodex`
- Aktywuje się tylko dla modeli obsługujących Codex (`openai-codex/*` lub providerów używających `api: "openai-codex-responses"`)
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

Jeśli natywne wyszukiwanie Codex jest włączone, ale bieżący model nie obsługuje Codex, OpenClaw zachowuje normalne zarządzane zachowanie `web_search`.

## Konfigurowanie wyszukiwania w sieci

Listy providerów w dokumentacji i przepływach konfiguracji są alfabetyczne. Automatyczne wykrywanie używa
osobnej kolejności priorytetów.

Jeśli nie ustawiono `provider`, OpenClaw sprawdza providerów w tej kolejności i używa
pierwszego, który jest gotowy:

Najpierw providerzy oparci na API:

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

10. **DuckDuckGo** -- bezkluczowy fallback HTML bez konta ani klucza API (kolejność 100)
11. **Ollama Web Search** -- bezkluczowy fallback przez skonfigurowany host Ollama; wymaga, aby Ollama było osiągalne i zalogowane przez `ollama signin`, i może ponownie użyć bearer auth providera Ollama, jeśli host tego wymaga (kolejność 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` lub `plugins.entries.searxng.config.webSearch.baseUrl` (kolejność 200)

Jeśli żaden provider nie zostanie wykryty, następuje fallback do Brave (otrzymasz błąd
brakującego klucza z prośbą o skonfigurowanie go).

<Note>
  Wszystkie pola kluczy providerów obsługują obiekty SecretRef. SecretRefs
  o zakresie pluginu w `plugins.entries.<plugin>.config.webSearch.apiKey` są rozwiązywane dla
  dołączonych providerów Exa, Firecrawl, Gemini, Grok, Kimi, Perplexity i Tavily
  niezależnie od tego, czy provider zostanie wybrany jawnie przez `tools.web.search.provider`, czy
  wybrany przez automatyczne wykrywanie. W trybie automatycznego wykrywania OpenClaw rozwiązuje tylko klucz
  wybranego providera -- SecretRefs niewybranych providerów pozostają nieaktywne, więc możesz
  utrzymywać skonfigurowanych wielu providerów bez kosztu rozwiązywania dla
  tych, których nie używasz.
</Note>

## Konfiguracja

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // domyślnie: true
        provider: "brave", // lub pomiń dla automatycznego wykrywania
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Konfiguracja specyficzna dla providera (klucze API, bazowe URL-e, tryby) znajduje się w
`plugins.entries.<plugin>.config.webSearch.*`. Przykłady znajdziesz na stronach providerów.

Wybór providera fallback `web_fetch` jest oddzielny:

- wybierz go przez `tools.web.fetch.provider`
- albo pomiń to pole i pozwól OpenClaw automatycznie wykryć pierwszego gotowego providera `web-fetch`
  na podstawie dostępnych poświadczeń
- obecnie dołączonym providerem `web-fetch` jest Firecrawl, konfigurowany w
  `plugins.entries.firecrawl.config.webFetch.*`

Gdy wybierzesz **Kimi** podczas `openclaw onboard` lub
`openclaw configure --section web`, OpenClaw może również zapytać o:

- region API Moonshot (`https://api.moonshot.ai/v1` lub `https://api.moonshot.cn/v1`)
- domyślny model wyszukiwania webowego Kimi (domyślnie `kimi-k2.6`)

Dla `x_search` skonfiguruj `plugins.entries.xai.config.xSearch.*`. Używa ono
tego samego fallbacku `XAI_API_KEY` co wyszukiwanie webowe Grok.
Starsza konfiguracja `tools.web.x_search.*` jest automatycznie migrowana przez `openclaw doctor --fix`.
Gdy wybierzesz Grok podczas `openclaw onboard` lub `openclaw configure --section web`,
OpenClaw może również zaoferować opcjonalną konfigurację `x_search` z tym samym kluczem.
Jest to osobny krok uzupełniający w ścieżce Grok, a nie osobny wybór providera
wyszukiwania webowego na najwyższym poziomie. Jeśli wybierzesz innego providera, OpenClaw nie
pokaże promptu `x_search`.

### Przechowywanie kluczy API

<Tabs>
  <Tab title="Plik konfiguracji">
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
  <Tab title="Zmienna środowiskowa">
    Ustaw zmienną env providera w środowisku procesu Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Dla instalacji Gateway umieść ją w `~/.openclaw/.env`.
    Zobacz [Zmienne env](/pl/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parametry narzędzia

| Parametr              | Opis                                                  |
| --------------------- | ----------------------------------------------------- |
| `query`               | Zapytanie wyszukiwania (wymagane)                     |
| `count`               | Liczba zwracanych wyników (1-10, domyślnie: 5)        |
| `country`             | 2-literowy kod kraju ISO (np. "US", "DE")             |
| `language`            | Kod języka ISO 639-1 (np. "en", "de")                 |
| `search_lang`         | Kod języka wyszukiwania (tylko Brave)                 |
| `freshness`           | Filtr czasu: `day`, `week`, `month` lub `year`        |
| `date_after`          | Wyniki po tej dacie (YYYY-MM-DD)                      |
| `date_before`         | Wyniki przed tą datą (YYYY-MM-DD)                     |
| `ui_lang`             | Kod języka UI (tylko Brave)                           |
| `domain_filter`       | Tablica allowlisty/denylisty domen (tylko Perplexity) |
| `max_tokens`          | Łączny budżet treści, domyślnie 25000 (tylko Perplexity) |
| `max_tokens_per_page` | Limit tokenów na stronę, domyślnie 2048 (tylko Perplexity) |

<Warning>
  Nie wszystkie parametry działają ze wszystkimi providerami. Tryb Brave `llm-context`
  odrzuca `ui_lang`, `freshness`, `date_after` i `date_before`.
  Gemini, Grok i Kimi zwracają jedną odpowiedź syntetyzowaną z cytowaniami. Przyjmują
  `count` dla zgodności ze współdzielonym narzędziem, ale nie zmienia to
  kształtu odpowiedzi osadzonej w źródłach.
  Perplexity zachowuje się tak samo, gdy używasz ścieżki zgodności Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` lub `OPENROUTER_API_KEY`).
  SearXNG akceptuje `http://` tylko dla zaufanych hostów prywatnej sieci lub loopback;
  publiczne endpointy SearXNG muszą używać `https://`.
  Firecrawl i Tavily obsługują tylko `query` i `count` przez `web_search`
  -- dla zaawansowanych opcji używaj ich dedykowanych narzędzi.
</Warning>

## x_search

`x_search` wykonuje zapytania do postów na X (dawniej Twitter) przy użyciu xAI i zwraca
odpowiedzi syntetyzowane przez AI z cytowaniami. Akceptuje zapytania w języku naturalnym oraz
opcjonalne filtry strukturalne. OpenClaw włącza wbudowane narzędzie xAI `x_search`
tylko dla żądania obsługującego to wywołanie narzędzia.

<Note>
  xAI dokumentuje `x_search` jako narzędzie obsługujące wyszukiwanie słów kluczowych, wyszukiwanie semantyczne, wyszukiwanie użytkowników
  i pobieranie wątków. Dla statystyk zaangażowania per post, takich jak reposty,
  odpowiedzi, zakładki lub wyświetlenia, preferuj celowane wyszukiwanie dokładnego URL-a
  posta lub ID statusu. Szerokie wyszukiwania po słowach kluczowych mogą znaleźć właściwy post, ale zwrócić mniej
  pełne metadane per post. Dobry wzorzec to: najpierw znajdź post, a potem
  wykonaj drugie zapytanie `x_search` skupione dokładnie na tym poście.
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
| `allowed_x_handles`          | Ogranicza wyniki do określonych kont X                 |
| `excluded_x_handles`         | Wyklucza określone konta X                             |
| `from_date`                  | Uwzględnia tylko posty od tej daty włącznie (YYYY-MM-DD) |
| `to_date`                    | Uwzględnia tylko posty do tej daty włącznie (YYYY-MM-DD) |
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
// Statystyki per post: gdy to możliwe, użyj dokładnego URL-a statusu lub ID statusu
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

Jeśli używasz profili narzędzi lub allowlist, dodaj `web_search`, `x_search` lub `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // lub: allow: ["group:web"]  (obejmuje web_search, x_search i web_fetch)
  },
}
```

## Powiązane

- [Web Fetch](/pl/tools/web-fetch) -- pobiera URL i wyodrębnia czytelną treść
- [Web Browser](/pl/tools/browser) -- pełna automatyzacja przeglądarki dla stron intensywnie używających JS
- [Grok Search](/pl/tools/grok-search) -- Grok jako provider `web_search`
- [Ollama Web Search](/pl/tools/ollama-search) -- bezkluczowe wyszukiwanie w sieci przez host Ollama
