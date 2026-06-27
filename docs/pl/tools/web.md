---
read_when:
    - Chcesz włączyć lub skonfigurować web_search
    - Chcesz włączyć lub skonfigurować x_search
    - Musisz wybrać dostawcę wyszukiwania
    - Chcesz zrozumieć automatyczne wykrywanie i wybór dostawcy
sidebarTitle: Web Search
summary: web_search, x_search i web_fetch -- przeszukują internet, przeszukują wpisy na X lub pobierają zawartość strony
title: Wyszukiwanie w sieci
x-i18n:
    generated_at: "2026-06-27T18:33:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a448de6760546863b840118ab04fec8ef4b3213c124a7f229ffe67536327f9a4
    source_path: tools/web.md
    workflow: 16
---

Narzędzie `web_search` przeszukuje web przy użyciu skonfigurowanego dostawcy i
zwraca wyniki. Wyniki są buforowane według zapytania przez 15 minut (konfigurowalne).

OpenClaw zawiera także `x_search` dla postów z X (dawniej Twitter) oraz
`web_fetch` do lekkiego pobierania URL-i. W tej fazie `web_fetch` pozostaje
lokalne, natomiast `web_search` i `x_search` mogą używać pod spodem xAI Responses.

<Info>
  `web_search` to lekkie narzędzie HTTP, a nie automatyzacja przeglądarki. W przypadku
  witryn mocno opartych na JS lub logowań użyj [Przeglądarki web](/pl/tools/browser). Do
  pobierania konkretnego URL-a użyj [Web Fetch](/pl/tools/web-fetch).
</Info>

## Szybki start

<Steps>
  <Step title="Choose a provider">
    Wybierz dostawcę i wykonaj wymaganą konfigurację. Niektórzy dostawcy
    nie wymagają klucza, inni używają kluczy API. Szczegóły znajdziesz
    na stronach dostawców poniżej.
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    To zapisuje dostawcę oraz wszelkie potrzebne dane uwierzytelniające. Możesz też ustawić
    zmienną środowiskową (na przykład `BRAVE_API_KEY`) i pominąć ten krok dla dostawców
    opartych na API.
  </Step>
  <Step title="Use it">
    Agent może teraz wywołać `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Dla postów z X użyj:

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
  <Card title="Codex Hosted Search" icon="search" href="/pl/plugins/codex-harness">
    Odpowiedzi syntetyzowane przez AI, oparte na źródłach, przez konto serwera aplikacji Codex.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/pl/tools/duckduckgo-search">
    Dostawca bez klucza. Klucz API nie jest potrzebny. Nieoficjalna integracja oparta na HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/pl/tools/exa-search">
    Wyszukiwanie neuronowe + słów kluczowych z ekstrakcją treści (wyróżnienia, tekst, streszczenia).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/pl/tools/firecrawl">
    Ustrukturyzowane wyniki. Najlepiej łączyć z `firecrawl_search` i `firecrawl_scrape` do głębokiej ekstrakcji.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/pl/tools/gemini-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami przez Google Search grounding.
  </Card>
  <Card title="Grok" icon="zap" href="/pl/tools/grok-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami przez xAI web grounding.
  </Card>
  <Card title="Kimi" icon="moon" href="/pl/tools/kimi-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami przez wyszukiwanie web Moonshot; nieugruntowane awaryjne przejścia do czatu kończą się jawnie błędem.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/pl/tools/minimax-search">
    Ustrukturyzowane wyniki przez API wyszukiwania MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/pl/tools/ollama-search">
    Wyszukiwanie przez zalogowany lokalny host Ollama albo hostowane API Ollama.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/pl/tools/parallel-search">
    Płatne API Parallel Search (`PARALLEL_API_KEY`); wyższe limity szybkości i dostrajanie celów.
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/pl/tools/parallel-search">
    Opcjonalne bez klucza. Bezpłatny Search MCP Parallel, z gęstymi fragmentami zoptymalizowanymi pod LLM i bez klucza API.
  </Card>
  <Card title="Perplexity" icon="search" href="/pl/tools/perplexity-search">
    Ustrukturyzowane wyniki z kontrolami ekstrakcji treści i filtrowaniem domen.
  </Card>
  <Card title="SearXNG" icon="server" href="/pl/tools/searxng-search">
    Samodzielnie hostowana metawyszukiwarka. Klucz API nie jest potrzebny. Agreguje Google, Bing, DuckDuckGo i inne.
  </Card>
  <Card title="Tavily" icon="globe" href="/pl/tools/tavily">
    Ustrukturyzowane wyniki z głębokością wyszukiwania, filtrowaniem tematów i `tavily_extract` do ekstrakcji URL-i.
  </Card>
</CardGroup>

### Porównanie dostawców

| Dostawca                                         | Styl wyników                                                   | Filtry                                           | Klucz API                                                                               |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/pl/tools/brave-search)                     | Ustrukturyzowane fragmenty                                     | Kraj, język, czas, tryb `llm-context`            | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/pl/plugins/codex-harness)    | Syntetyzowane przez AI + źródłowe URL-e                        | Domeny, rozmiar kontekstu, lokalizacja użytkownika | Brak; używa logowania Codex/OpenAI                                                      |
| [DuckDuckGo](/pl/tools/duckduckgo-search)           | Ustrukturyzowane fragmenty                                     | --                                               | Brak (bez klucza)                                                                       |
| [Exa](/pl/tools/exa-search)                         | Ustrukturyzowane + wyekstrahowane                              | Tryb neuronowy/słów kluczowych, data, ekstrakcja treści | `EXA_API_KEY`                                                                           |
| [Firecrawl](/pl/tools/firecrawl)                    | Ustrukturyzowane fragmenty                                     | Przez narzędzie `firecrawl_search`               | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/pl/tools/gemini-search)                   | Syntetyzowane przez AI + cytowania                             | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/pl/tools/grok-search)                       | Syntetyzowane przez AI + cytowania                             | --                                               | OAuth xAI, `XAI_API_KEY` albo `plugins.entries.xai.config.webSearch.apiKey`             |
| [Kimi](/pl/tools/kimi-search)                       | Syntetyzowane przez AI + cytowania; kończy się błędem przy nieugruntowanych awaryjnych przejściach do czatu | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/pl/tools/minimax-search)          | Ustrukturyzowane fragmenty                                     | Region (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/pl/tools/ollama-search)        | Ustrukturyzowane fragmenty                                     | --                                               | Brak dla zalogowanych lokalnych hostów; `OLLAMA_API_KEY` dla bezpośredniego wyszukiwania `https://ollama.com` |
| [Parallel](/pl/tools/parallel-search)               | Gęste fragmenty klasyfikowane pod kontekst LLM                 | --                                               | `PARALLEL_API_KEY` (płatny)                                                             |
| [Parallel Search (Free)](/pl/tools/parallel-search) | Gęste fragmenty klasyfikowane pod kontekst LLM                 | --                                               | Brak (bezpłatny Search MCP)                                                             |
| [Perplexity](/pl/tools/perplexity-search)           | Ustrukturyzowane fragmenty                                     | Kraj, język, czas, domeny, limity treści         | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/pl/tools/searxng-search)                 | Ustrukturyzowane fragmenty                                     | Kategorie, język                                 | Brak (samodzielnie hostowane)                                                           |
| [Tavily](/pl/tools/tavily)                          | Ustrukturyzowane fragmenty                                     | Przez narzędzie `tavily_search`                  | `TAVILY_API_KEY`                                                                        |

## Automatyczne wykrywanie

## Natywne wyszukiwanie web OpenAI

Bezpośrednie modele OpenAI Responses automatycznie używają hostowanego przez OpenAI narzędzia `web_search`, gdy wyszukiwanie web OpenClaw jest włączone i nie przypięto zarządzanego dostawcy. Jest to zachowanie należące do dostawcy w dołączonym Plugin OpenAI i dotyczy tylko natywnego ruchu API OpenAI, a nie bazowych URL-i proxy zgodnych z OpenAI ani tras Azure. Ustaw `tools.web.search.provider` na innego dostawcę, takiego jak `brave`, aby zachować zarządzane narzędzie `web_search` dla modeli OpenAI, albo ustaw `tools.web.search.enabled: false`, aby wyłączyć zarówno zarządzane wyszukiwanie, jak i natywne wyszukiwanie OpenAI.

## Natywne wyszukiwanie web Codex

Środowisko uruchomieniowe serwera aplikacji Codex automatycznie używa hostowanego przez Codex narzędzia `web_search`,
gdy wyszukiwanie web jest włączone i nie wybrano zarządzanego dostawcy. Natywne hostowane
wyszukiwanie i zarządzane przez OpenClaw dynamiczne narzędzie `web_search` wzajemnie się wykluczają,
więc zarządzane wyszukiwanie nie może omijać natywnych ograniczeń domen. OpenClaw używa
zarządzanego narzędzia, gdy hostowane wyszukiwanie jest niedostępne, jawnie wyłączone albo
zastąpione wybranym zarządzanym dostawcą. OpenClaw utrzymuje samodzielne
rozszerzenie `web.run` Codex jako wyłączone, ponieważ produkcyjny ruch serwera aplikacji odrzuca jego
zdefiniowaną przez użytkownika przestrzeń nazw `web`.

- Skonfiguruj natywne wyszukiwanie w `tools.web.search.openaiCodex`
- Ustaw `tools.web.search.provider: "codex"`, aby udostępnić Codex Hosted Search jako
  zarządzanego dostawcę `web_search` dla dowolnego modelu nadrzędnego. Każde wywołanie uruchamia
  ograniczoną efemeryczną turę serwera aplikacji Codex i kończy się błędem, jeśli Codex nie wyemituje
  hostowanego elementu `webSearch`.
- `mode: "cached"` jest domyślną preferencją, ale Codex rozwiązuje ją do dostępu na żywo
  do zewnętrznych zasobów dla nieograniczonych tur serwera aplikacji; ustaw `"live"`, aby zażądać
  jawnie dostępu na żywo
- Ustaw `tools.web.search.provider` na zarządzanego dostawcę, takiego jak `brave`, aby używać
  zarządzanego przez OpenClaw `web_search` zamiast tego
- Ustaw `tools.web.search.openaiCodex.enabled: false`, aby zrezygnować z wyszukiwania
  hostowanego przez Codex; inni zarządzani dostawcy pozostają dostępni
- Ograniczenie natywnej powierzchni narzędzi Codex także utrzymuje dostępność zarządzanego `web_search`
- Gdy ustawiono `allowedDomains`, automatyczny zarządzany fallback kończy się bezpiecznie błędem, jeśli
  hostowane wyszukiwanie jest niedostępne, aby nie można było obejść natywnej listy dozwolonych domen
- Uruchomienia LLM-only z wyłączonymi narzędziami wyłączają zarówno natywne, jak i zarządzane wyszukiwanie
- `tools.web.search.enabled: false` wyłącza zarówno zarządzane, jak i natywne wyszukiwanie

Trwałe skuteczne zmiany polityki wyszukiwania Codex uruchamiają świeży powiązany wątek, aby
już załadowany wątek serwera aplikacji nie mógł zachować nieaktualnego dostępu do hostowanego wyszukiwania.
Przejściowe ograniczenia na turę używają tymczasowego ograniczonego wątku i zachowują
istniejące powiązanie do późniejszego wznowienia.

Bezpośredni ruch OpenAI ChatGPT Responses może także używać hostowanego przez OpenAI
narzędzia `web_search`. Ta osobna ścieżka pozostaje opcjonalna przez
`tools.web.search.openaiCodex.enabled: true` i dotyczy tylko kwalifikujących się
modeli `openai/*` używających `api: "openai-chatgpt-responses"`.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Optional: use Codex Hosted Search from non-Codex parent models too.
        provider: "codex",
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

Dla środowisk uruchomieniowych i dostawców, którzy nie obsługują natywnego wyszukiwania Codex, Codex może
używać zarządzanego fallbacku `web_search` przez dynamiczną przestrzeń nazw narzędzi OpenClaw.
Użyj jawnego zarządzanego dostawcy, gdy potrzebujesz specyficznych dla dostawcy OpenClaw
kontroli sieciowych zamiast wyszukiwania hostowanego przez Codex.

Wybranie `provider: "codex"` włącza dołączony Plugin `codex` i używa
tych samych ograniczeń `tools.web.search.openaiCodex`, które pokazano powyżej. Najpierw uwierzytelnij
serwer aplikacji Codex za pomocą `openclaw models auth login --provider openai`.
Agent nadrzędny może używać dowolnego modelu lub środowiska uruchomieniowego; tylko ograniczony worker wyszukiwania
działa przez Codex.

## Bezpieczeństwo sieci

Zarządzane wywołania dostawcy HTTP `web_search` używają chronionej ścieżki pobierania OpenClaw. Dla
zaufanych hostów API dostawców OpenClaw dopuszcza odpowiedzi DNS fake-IP z Surge, Clash i sing-box
w `198.18.0.0/15` oraz `fc00::/7` tylko dla nazwy hosta tego dostawcy.
Inne miejsca docelowe prywatne, loopback, link-local i metadata pozostają blokowane.
Codex Hosted Search jest wyjątkiem: jego ograniczony worker deleguje dostęp
sieciowy do hostowanego narzędzia `web_search` serwera aplikacji Codex.

To automatyczne dopuszczenie nie ma zastosowania do dowolnych adresów URL `web_fetch`. Dla
`web_fetch` włącz `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` oraz
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` jawnie tylko wtedy, gdy Twój
zaufany proxy jest właścicielem tych syntetycznych zakresów.

## Konfigurowanie wyszukiwania w sieci

Listy dostawców w dokumentacji i przepływach konfiguracji są alfabetyczne. Automatyczne wykrywanie utrzymuje
osobną kolejność pierwszeństwa.

Jeśli nie ustawiono `provider`, OpenClaw sprawdza dostawców w tej kolejności i używa
pierwszego, który jest gotowy:

Najpierw dostawcy oparci na API:

1. **Brave** -- `BRAVE_API_KEY` lub `plugins.entries.brave.config.webSearch.apiKey` (kolejność 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` lub `plugins.entries.minimax.config.webSearch.apiKey` (kolejność 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` lub `models.providers.google.apiKey` (kolejność 20)
4. **Grok** -- xAI OAuth, `XAI_API_KEY` lub `plugins.entries.xai.config.webSearch.apiKey` (kolejność 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` lub `plugins.entries.moonshot.config.webSearch.apiKey` (kolejność 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` lub `plugins.entries.perplexity.config.webSearch.apiKey` (kolejność 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` lub `plugins.entries.firecrawl.config.webSearch.apiKey` (kolejność 60)
8. **Exa** -- `EXA_API_KEY` lub `plugins.entries.exa.config.webSearch.apiKey`; opcjonalne `plugins.entries.exa.config.webSearch.baseUrl` nadpisuje punkt końcowy Exa (kolejność 65)
9. **Tavily** -- `TAVILY_API_KEY` lub `plugins.entries.tavily.config.webSearch.apiKey` (kolejność 70)
10. **Parallel** -- płatne Parallel Search API przez `PARALLEL_API_KEY` lub `plugins.entries.parallel.config.webSearch.apiKey`; opcjonalne `plugins.entries.parallel.config.webSearch.baseUrl` nadpisuje punkt końcowy (kolejność 75)

Następnie dostawcy ze skonfigurowanym punktem końcowym:

11. **SearXNG** -- `SEARXNG_BASE_URL` lub `plugins.entries.searxng.config.webSearch.baseUrl` (kolejność 200)

Dostawcy bez klucza, tacy jak **Parallel Search (Free)**, **DuckDuckGo**,
**Ollama Web Search** i **Codex Hosted Search**, są dostępni tylko wtedy, gdy
wybierzesz ich jawnie za pomocą `tools.web.search.provider` lub przez
`openclaw configure --section web`. OpenClaw nie wysyła zarządzanych zapytań
`web_search` do dostawcy bez klucza tylko dlatego, że nie skonfigurowano żadnego
dostawcy opartego na API.

Modele OpenAI Responses są wyjątkiem: gdy `tools.web.search.provider` jest
nieustawiony, używają natywnego wyszukiwania w sieci OpenAI zamiast powyższych
zarządzanych dostawców. Ustaw `tools.web.search.provider` na `parallel-free` (lub innego dostawcę),
aby kierować je przez zarządzaną ścieżkę.

<Note>
  Wszystkie pola kluczy dostawców obsługują obiekty SecretRef. SecretRef o zakresie Pluginu
  pod `plugins.entries.<plugin>.config.webSearch.apiKey` są rozwiązywane dla
  zainstalowanych dostawców wyszukiwania w sieci opartych na API, w tym Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity i Tavily,
  niezależnie od tego, czy dostawca jest wybrany jawnie przez `tools.web.search.provider`, czy
  wybrany przez automatyczne wykrywanie. W trybie automatycznego wykrywania OpenClaw rozwiązuje tylko
  klucz wybranego dostawcy -- niewybrane SecretRef pozostają nieaktywne, więc możesz
  utrzymywać skonfigurowanych wielu dostawców bez ponoszenia kosztu rozwiązywania dla tych,
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
`plugins.entries.<plugin>.config.webSearch.*`. Gemini może też ponownie używać
`models.providers.google.apiKey` i `models.providers.google.baseUrl` jako zapasowych opcji
o niższym priorytecie po swojej dedykowanej konfiguracji wyszukiwania w sieci i `GEMINI_API_KEY`. Zobacz
strony dostawców, aby poznać przykłady.
Grok może też ponownie używać profilu uwierzytelniania xAI OAuth z `openclaw models auth login
--provider xai --method oauth`; konfiguracja klucza API pozostaje opcją zapasową.

`tools.web.search.provider` jest walidowany względem identyfikatorów dostawców wyszukiwania w sieci
zadeklarowanych przez manifesty dołączonych i zainstalowanych Pluginów. Literówka taka jak `"brvae"`
powoduje błąd walidacji konfiguracji zamiast cichego powrotu do automatycznego wykrywania. Jeśli
skonfigurowany dostawca ma tylko nieaktualne dowody Pluginu, takie jak pozostawiony blok
`plugins.entries.<plugin>` po odinstalowaniu zewnętrznego Pluginu,
OpenClaw zachowuje odporność uruchamiania i zgłasza ostrzeżenie, aby można było ponownie zainstalować
Plugin albo uruchomić `openclaw doctor --fix`, aby wyczyścić nieaktualną konfigurację.

Wybór zapasowego dostawcy `web_fetch` jest osobny:

- wybierz go za pomocą `tools.web.fetch.provider`
- albo pomiń to pole i pozwól OpenClaw automatycznie wykryć pierwszego gotowego dostawcę web-fetch
  ze skonfigurowanych poświadczeń
- niesandboxowane `web_fetch` może używać zainstalowanych dostawców Pluginów, które deklarują
  `contracts.webFetchProviders`; sandboxowane pobierania dopuszczają dołączonych dostawców i
  zweryfikowane oficjalne instalacje Pluginów, ale wykluczają zewnętrzne Pluginy innych firm
- oficjalny Plugin Firecrawl zapewnia zapasowe web-fetch, konfigurowane pod
  `plugins.entries.firecrawl.config.webFetch.*`

Gdy wybierzesz **Kimi** podczas `openclaw onboard` lub
`openclaw configure --section web`, OpenClaw może też zapytać o:

- region Moonshot API (`https://api.moonshot.ai/v1` lub `https://api.moonshot.cn/v1`)
- domyślny model wyszukiwania w sieci Kimi (domyślnie `kimi-k2.6`)

Dla `x_search` skonfiguruj `plugins.entries.xai.config.xSearch.*`. Używa tego
samego profilu uwierzytelniania xAI co czat albo poświadczenia `XAI_API_KEY` / wyszukiwania w sieci Pluginu
używanego przez wyszukiwanie w sieci Grok.
Starsza konfiguracja `tools.web.x_search.*` jest automatycznie migrowana przez `openclaw doctor --fix`.
Gdy wybierzesz Grok podczas `openclaw onboard` lub `openclaw configure --section web`,
OpenClaw może też zaoferować opcjonalną konfigurację `x_search` z tym samym poświadczeniem.
Jest to osobny krok uzupełniający w ścieżce Grok, a nie osobny wybór dostawcy
wyszukiwania w sieci najwyższego poziomu. Jeśli wybierzesz innego dostawcę, OpenClaw nie
pokazuje monitu `x_search`.

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
| `freshness`           | Filtr czasu: `day`, `week`, `month` lub `year`        |
| `date_after`          | Wyniki po tej dacie (YYYY-MM-DD)                      |
| `date_before`         | Wyniki przed tą datą (YYYY-MM-DD)                     |
| `ui_lang`             | Kod języka interfejsu (tylko Brave)                   |
| `domain_filter`       | Tablica listy dozwolonych/zabronionych domen (tylko Perplexity) |
| `max_tokens`          | Łączny budżet treści, domyślnie 25000 (tylko Perplexity) |
| `max_tokens_per_page` | Limit tokenów na stronę, domyślnie 2048 (tylko Perplexity) |

<Warning>
  Nie wszystkie parametry działają ze wszystkimi dostawcami. Tryb Brave `llm-context`
  odrzuca `ui_lang`; `date_before` wymaga też `date_after`, ponieważ niestandardowe
  zakresy świeżości Brave wymagają zarówno daty początkowej, jak i końcowej.
  Gemini, Grok i Kimi zwracają jedną zsyntetyzowaną odpowiedź z cytowaniami. Akceptują
  `count` dla zgodności współdzielonego narzędzia, ale nie zmienia to kształtu
  ugruntowanej odpowiedzi. Gemini traktuje świeżość `day` jako wskazówkę aktualności; szersze
  wartości świeżości i jawne daty ustawiają zakresy czasu ugruntowania Google Search.
  Perplexity zachowuje się tak samo, gdy używasz ścieżki zgodności Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` lub `OPENROUTER_API_KEY`).
  SearXNG akceptuje `http://` tylko dla zaufanych hostów sieci prywatnej lub loopback;
  publiczne punkty końcowe SearXNG muszą używać `https://`.
  Firecrawl i Tavily obsługują tylko `query` i `count` przez `web_search`
  -- użyj ich dedykowanych narzędzi dla zaawansowanych opcji.
</Warning>

## x_search

`x_search` wyszukuje posty X (dawniej Twitter) za pomocą xAI i zwraca
odpowiedzi syntetyzowane przez AI z cytowaniami. Akceptuje zapytania w języku naturalnym i
opcjonalne filtry strukturalne. OpenClaw włącza wbudowane narzędzie xAI `x_search`
tylko dla żądania obsługującego to wywołanie narzędzia.

<Note>
  xAI dokumentuje `x_search` jako obsługujące wyszukiwanie słów kluczowych, wyszukiwanie semantyczne, wyszukiwanie użytkowników
  i pobieranie wątków. Dla statystyk zaangażowania pojedynczego posta, takich jak reposty,
  odpowiedzi, zakładki lub wyświetlenia, preferuj ukierunkowane wyszukanie dokładnego adresu URL posta
  albo identyfikatora statusu. Szerokie wyszukiwania słów kluczowych mogą znaleźć właściwy post, ale zwrócić mniej
  kompletne metadane pojedynczego posta. Dobry wzorzec to: najpierw zlokalizuj post, potem
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
            baseUrl: "https://api.x.ai/v1", // optional, overrides webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if an xAI auth profile or XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`x_search` wysyła żądania POST do `<baseUrl>/responses`, gdy
`plugins.entries.xai.config.xSearch.baseUrl` jest ustawione. Jeśli to pole zostanie pominięte,
wraca do `plugins.entries.xai.config.webSearch.baseUrl`, następnie do
starszego `tools.web.search.grok.baseUrl`, a na końcu do publicznego punktu końcowego xAI.

### Parametry x_search

| Parametr                     | Opis                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Zapytanie wyszukiwania (wymagane)                      |
| `allowed_x_handles`          | Ogranicz wyniki do określonych uchwytów X              |
| `excluded_x_handles`         | Wyklucz określone uchwyty X                            |
| `from_date`                  | Uwzględniaj tylko posty z tej daty lub późniejsze (YYYY-MM-DD) |
| `to_date`                    | Uwzględniaj tylko posty z tej daty lub wcześniejsze (YYYY-MM-DD) |
| `enable_image_understanding` | Pozwól xAI analizować obrazy dołączone do pasujących postów |
| `enable_video_understanding` | Pozwól xAI analizować filmy dołączone do pasujących postów |

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

- [Pobieranie z sieci](/pl/tools/web-fetch) -- pobierz URL i wyodrębnij czytelną treść
- [Przeglądarka internetowa](/pl/tools/browser) -- pełna automatyzacja przeglądarki dla stron intensywnie korzystających z JS
- [Wyszukiwanie Grok](/pl/tools/grok-search) -- Grok jako dostawca `web_search`
- [Wyszukiwanie internetowe Ollama](/pl/tools/ollama-search) -- wyszukiwanie w sieci bez klucza przez host Ollama
