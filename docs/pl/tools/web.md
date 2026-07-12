---
read_when:
    - Chcesz włączyć lub skonfigurować web_search
    - Chcesz włączyć lub skonfigurować x_search
    - Musisz wybrać dostawcę wyszukiwania
    - Chcesz zrozumieć automatyczne wykrywanie i wybór dostawcy
sidebarTitle: Web Search
summary: web_search, x_search i web_fetch — przeszukiwanie internetu, przeszukiwanie postów na X lub pobieranie zawartości strony
title: Wyszukiwanie w sieci
x-i18n:
    generated_at: "2026-07-12T15:45:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58db549f5133a98a2ee9514f570ba8bd99b793e912ed3e0da296f454c88692a7
    source_path: tools/web.md
    workflow: 16
---

`web_search` przeszukuje internet za pomocą skonfigurowanego dostawcy i zwraca
znormalizowane wyniki, buforowane według zapytania przez 15 minut (wartość konfigurowalna). OpenClaw
zawiera również `x_search` do wyszukiwania postów w serwisie X (dawniej Twitter) oraz `web_fetch` do
lekkiego pobierania adresów URL. `web_fetch` zawsze działa lokalnie; `web_search` jest kierowane
przez xAI Responses, gdy dostawcą jest Grok, a `x_search` zawsze używa
xAI Responses.

<Info>
  `web_search` to lekkie narzędzie HTTP, a nie automatyzacja przeglądarki. W przypadku
  witryn intensywnie korzystających z JS lub wymagających logowania użyj [przeglądarki internetowej](/pl/tools/browser). Aby
  pobrać konkretny adres URL, użyj [Web Fetch](/pl/tools/web-fetch).
</Info>

## Szybki start

<Steps>
  <Step title="Wybierz dostawcę">
    Wybierz dostawcę i przeprowadź wymaganą konfigurację. Niektórzy dostawcy
    nie wymagają klucza, a inni potrzebują klucza API. Szczegółowe informacje znajdziesz
    na stronach dostawców poniżej.
  </Step>
  <Step title="Skonfiguruj">
    ```bash
    openclaw configure --section web
    ```
    To zapisuje dostawcę i wszelkie wymagane dane uwierzytelniające. W przypadku dostawców
    korzystających z API możesz zamiast tego ustawić zmienną środowiskową dostawcy (na przykład
    `BRAVE_API_KEY`) i pominąć ten krok.
  </Step>
  <Step title="Użyj">
    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    W przypadku postów w serwisie X:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Wybór dostawcy

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/pl/tools/brave-search">
    Ustrukturyzowane wyniki z fragmentami. Obsługuje tryb `llm-context` oraz filtry kraju i języka. Dostępny jest bezpłatny plan.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/pl/plugins/codex-harness">
    Odpowiedzi oparte na źródłach, syntetyzowane przez AI za pośrednictwem konta serwera aplikacji Codex.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/pl/tools/duckduckgo-search">
    Dostawca niewymagający klucza. Klucz API nie jest potrzebny. Nieoficjalna integracja oparta na HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/pl/tools/exa-search">
    Wyszukiwanie neuronowe i według słów kluczowych z wyodrębnianiem treści (wyróżnienia, tekst, podsumowania).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/pl/tools/firecrawl">
    Ustrukturyzowane wyniki. Najlepiej łączyć z `firecrawl_search` i `firecrawl_scrape` w celu dokładnego wyodrębniania.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/pl/tools/gemini-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami, oparte na wyszukiwarce Google.
  </Card>
  <Card title="Grok" icon="zap" href="/pl/tools/grok-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami, oparte na wyszukiwaniu internetowym xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/pl/tools/kimi-search">
    Odpowiedzi syntetyzowane przez AI z cytowaniami za pośrednictwem wyszukiwarki internetowej Moonshot; awaryjne odpowiedzi czatu bez oparcia w źródłach kończą się jawnym błędem.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/pl/tools/minimax-search">
    Ustrukturyzowane wyniki za pośrednictwem API wyszukiwania MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/pl/tools/ollama-search">
    Wyszukiwanie za pośrednictwem lokalnego hosta Ollama z aktywną sesją lub hostowanego API Ollama.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/pl/tools/parallel-search">
    Płatne API Parallel Search (`PARALLEL_API_KEY`); wyższe limity częstotliwości i dostrajanie celu.
  </Card>
  <Card title="Parallel Search (bezpłatne)" icon="layer-group" href="/pl/tools/parallel-search">
    Opcja bez klucza, wymagająca jawnego włączenia. Bezpłatny Search MCP firmy Parallel, z gęstymi fragmentami zoptymalizowanymi pod kątem LLM i bez klucza API.
  </Card>
  <Card title="Perplexity" icon="search" href="/pl/tools/perplexity-search">
    Ustrukturyzowane wyniki z kontrolą wyodrębniania treści i filtrowaniem domen.
  </Card>
  <Card title="SearXNG" icon="server" href="/pl/tools/searxng-search">
    Samodzielnie hostowana metawyszukiwarka. Klucz API nie jest potrzebny. Agreguje wyniki z Google, Bing, DuckDuckGo i innych.
  </Card>
  <Card title="Tavily" icon="globe" href="/pl/tools/tavily">
    Ustrukturyzowane wyniki z wyborem głębokości wyszukiwania, filtrowaniem tematycznym i narzędziem `tavily_extract` do wyodrębniania treści z adresów URL.
  </Card>
</CardGroup>

### Porównanie dostawców

| Dostawca                                         | Styl wyników                                                   | Filtry                                          | Klucz API                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/pl/tools/brave-search)                     | Ustrukturyzowane fragmenty                                            | Kraj, język, czas, tryb `llm-context`      | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/pl/plugins/codex-harness)    | Synteza AI + adresy URL źródeł                                   | Domeny, rozmiar kontekstu, lokalizacja użytkownika             | Brak; używa logowania Codex/OpenAI                                                         |
| [DuckDuckGo](/pl/tools/duckduckgo-search)           | Ustrukturyzowane fragmenty                                            | --                                               | Brak (bez klucza)                                                                         |
| [Exa](/pl/tools/exa-search)                         | Ustrukturyzowane + wyodrębnione                                         | Tryb neuronowy/według słów kluczowych, data, wyodrębnianie treści    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/pl/tools/firecrawl)                    | Ustrukturyzowane fragmenty                                            | Za pośrednictwem narzędzia `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/pl/tools/gemini-search)                   | Synteza AI + cytowania                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/pl/tools/grok-search)                       | Synteza AI + cytowania                                     | --                                               | OAuth xAI, `XAI_API_KEY` lub `plugins.entries.xai.config.webSearch.apiKey`              |
| [Kimi](/pl/tools/kimi-search)                       | Synteza AI + cytowania; błąd przy awaryjnych odpowiedziach czatu bez oparcia w źródłach | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/pl/tools/minimax-search)          | Ustrukturyzowane fragmenty                                            | Region (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/pl/tools/ollama-search)        | Ustrukturyzowane fragmenty                                            | --                                               | Brak dla lokalnych hostów z aktywną sesją; `OLLAMA_API_KEY` do bezpośredniego wyszukiwania przez `https://ollama.com` |
| [Parallel](/pl/tools/parallel-search)               | Gęste fragmenty uszeregowane pod kątem kontekstu LLM                          | --                                               | `PARALLEL_API_KEY` (płatny)                                                               |
| [Parallel Search (bezpłatne)](/pl/tools/parallel-search) | Gęste fragmenty uszeregowane pod kątem kontekstu LLM                          | --                                               | Brak (bezpłatny Search MCP)                                                                  |
| [Perplexity](/pl/tools/perplexity-search)           | Ustrukturyzowane fragmenty                                            | Kraj, język, czas, domeny, limity treści | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/pl/tools/searxng-search)                 | Ustrukturyzowane fragmenty                                            | Kategorie, język                             | Brak (samodzielne hostowanie)                                                                      |
| [Tavily](/pl/tools/tavily)                          | Ustrukturyzowane fragmenty                                            | Za pośrednictwem narzędzia `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## Automatyczne wykrywanie

Listy dostawców w dokumentacji i procesach konfiguracji są uporządkowane alfabetycznie. Automatyczne wykrywanie używa
odrębnej, stałej kolejności pierwszeństwa i wybiera dostawcę wymagającego
danych uwierzytelniających (`requiresCredential !== false`) tylko wtedy, gdy znajdzie skonfigurowane dane. Jeśli
nie ustawiono `provider`, OpenClaw sprawdza dostawców w następującej kolejności i używa
pierwszego, który jest gotowy:

Najpierw dostawcy korzystający z API:

1. **Brave** -- `BRAVE_API_KEY` lub `plugins.entries.brave.config.webSearch.apiKey` (kolejność 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` lub `plugins.entries.minimax.config.webSearch.apiKey` (kolejność 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` lub `models.providers.google.apiKey` (kolejność 20)
4. **Grok** -- OAuth xAI, `XAI_API_KEY` lub `plugins.entries.xai.config.webSearch.apiKey` (kolejność 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` lub `plugins.entries.moonshot.config.webSearch.apiKey` (kolejność 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` lub `plugins.entries.perplexity.config.webSearch.apiKey` (kolejność 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` lub `plugins.entries.firecrawl.config.webSearch.apiKey` (kolejność 60)
8. **Exa** -- `EXA_API_KEY` lub `plugins.entries.exa.config.webSearch.apiKey`; opcjonalne ustawienie `plugins.entries.exa.config.webSearch.baseUrl` zastępuje punkt końcowy Exa (kolejność 65)
9. **Tavily** -- `TAVILY_API_KEY` lub `plugins.entries.tavily.config.webSearch.apiKey` (kolejność 70)
10. **Parallel** -- płatne API Parallel Search za pośrednictwem `PARALLEL_API_KEY` lub `plugins.entries.parallel.config.webSearch.apiKey`; opcjonalne ustawienie `plugins.entries.parallel.config.webSearch.baseUrl` zastępuje punkt końcowy (kolejność 75)

Następnie dostawcy ze skonfigurowanymi punktami końcowymi:

11. **SearXNG** -- `SEARXNG_BASE_URL` lub `plugins.entries.searxng.config.webSearch.baseUrl` (kolejność 200)

Dostawcy niewymagający klucza, tacy jak **Parallel Search (bezpłatne)**, **DuckDuckGo**,
**Ollama Web Search** i **Codex Hosted Search**, nigdy nie są wybierani przez automatyczne wykrywanie,
mimo że mają wewnętrzną wartość kolejności. Są używani tylko wtedy, gdy
wybierzesz ich jawnie za pomocą `tools.web.search.provider` lub przez
`openclaw configure --section web`. OpenClaw nie wysyła zarządzanych
zapytań `web_search` do dostawcy niewymagającego klucza tylko dlatego, że nie skonfigurowano żadnego
dostawcy korzystającego z API.

Wyjątkiem są modele OpenAI Responses: gdy `tools.web.search.provider`
nie jest ustawione, używają natywnego wyszukiwania internetowego OpenAI zamiast zarządzanych
dostawców wymienionych powyżej (patrz niżej). Ustaw `tools.web.search.provider` na
`parallel-free` (lub innego dostawcę), aby zamiast tego kierować je przez zarządzaną ścieżkę.

<Note>
  Wszystkie pola kluczy dostawców obsługują obiekty SecretRef. Obiekty SecretRef o zakresie Pluginu
  w `plugins.entries.<plugin>.config.webSearch.apiKey` są rozwiązywane dla
  zainstalowanych dostawców wyszukiwania internetowego korzystających z API, w tym Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity i Tavily,
  niezależnie od tego, czy dostawca został wybrany jawnie przez `tools.web.search.provider`, czy
  za pomocą automatycznego wykrywania. W trybie automatycznego wykrywania OpenClaw rozwiązuje tylko klucz
  wybranego dostawcy — niewybrane obiekty SecretRef pozostają nieaktywne, dzięki czemu można
  skonfigurować wielu dostawców bez ponoszenia kosztu rozwiązywania dla tych,
  których nie używasz.
</Note>

## Natywne wyszukiwanie internetowe OpenAI

Bezpośrednie modele OpenAI Responses (`api: "openai-responses"`, dostawca `openai`,
bez bazowego adresu URL lub z oficjalnym bazowym adresem URL API OpenAI) automatycznie używają hostowanego przez OpenAI
narzędzia `web_search`, gdy wyszukiwanie internetowe OpenClaw jest włączone i nie
wybrano na stałe żadnego zarządzanego dostawcy. Jest to zachowanie kontrolowane przez dostawcę w dołączonym
pluginie OpenAI i nie dotyczy bazowych adresów URL serwerów proxy zgodnych z OpenAI ani tras
Azure. Ustaw `tools.web.search.provider` na innego dostawcę, takiego jak `brave`, aby
zachować zarządzane narzędzie `web_search` dla modeli OpenAI, albo ustaw
`tools.web.search.enabled: false`, aby wyłączyć zarówno wyszukiwanie zarządzane, jak i natywne
wyszukiwanie OpenAI.

## Natywne wyszukiwanie internetowe Codex

Środowisko uruchomieniowe serwera aplikacji Codex automatycznie używa hostowanego przez Codex narzędzia `web_search`,
gdy wyszukiwanie internetowe jest włączone i nie wybrano żadnego zarządzanego dostawcy. Natywne wyszukiwanie
hostowane i dynamiczne zarządzane narzędzie `web_search` OpenClaw wzajemnie się wykluczają,
dlatego wyszukiwanie zarządzane nie może omijać natywnych ograniczeń domen. OpenClaw używa
narzędzia zarządzanego, gdy wyszukiwanie hostowane jest niedostępne, jawnie wyłączone lub
zastąpione przez wybranego zarządzanego dostawcę. OpenClaw pozostawia samodzielne
rozszerzenie `web.run` Codex wyłączone (`features.standalone_web_search: false`),
ponieważ produkcyjny ruch serwera aplikacji odrzuca zdefiniowaną przez użytkownika przestrzeń nazw `web`.

- Skonfiguruj natywne wyszukiwanie w `tools.web.search.openaiCodex`
- Ustaw `tools.web.search.provider: "codex"`, aby udostępnić Codex Hosted Search jako
  zarządzanego dostawcę `web_search` dla dowolnego modelu nadrzędnego. Każde wywołanie uruchamia
  ograniczoną, efemeryczną turę serwera aplikacji Codex i kończy się niepowodzeniem, jeśli Codex nie wyemituje
  hostowanego elementu `webSearch`.
- `mode: "cached"` jest domyślną preferencją, ale Codex rozwiązuje ją jako dostęp na żywo
  do zasobów zewnętrznych w nieograniczonych turach serwera aplikacji; ustaw `"live"`, aby jawnie zażądać
  dostępu na żywo
- Ustaw `tools.web.search.provider` na zarządzanego dostawcę, takiego jak `brave`, aby zamiast tego używać
  zarządzanego narzędzia `web_search` OpenClaw
- Ustaw `tools.web.search.openaiCodex.enabled: false`, aby zrezygnować z wyszukiwania
  hostowanego przez Codex; inni zarządzani dostawcy pozostaną dostępni
- Ograniczenie powierzchni natywnych narzędzi Codex również zachowuje dostępność zarządzanego `web_search`
- Gdy ustawiono `allowedDomains`, automatyczny zarządzany mechanizm zastępczy odmawia działania, jeśli
  wyszukiwanie hostowane jest niedostępne, dzięki czemu nie można ominąć natywnej listy dozwolonych domen
- Uruchomienia wyłącznie z modelem LLM, z wyłączonymi narzędziami, wyłączają zarówno wyszukiwanie natywne, jak i zarządzane
- `tools.web.search.enabled: false` wyłącza zarówno wyszukiwanie zarządzane, jak i natywne

Trwałe zmiany efektywnej polityki wyszukiwania Codex rozpoczynają nowy powiązany wątek, aby
już załadowany wątek serwera aplikacji nie mógł zachować nieaktualnego dostępu do wyszukiwania hostowanego.
Tymczasowe ograniczenia na pojedynczą turę używają tymczasowego ograniczonego wątku i zachowują
istniejące powiązanie do późniejszego wznowienia.

Bezpośredni ruch OpenAI ChatGPT Responses może również używać hostowanego przez OpenAI
narzędzia `web_search`. Ta osobna ścieżka nadal wymaga jawnego włączenia przez
`tools.web.search.openaiCodex.enabled: true` i dotyczy wyłącznie kwalifikujących się
modeli `openai/*` używających `api: "openai-chatgpt-responses"`.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Opcjonalnie: używaj Codex Hosted Search również z modelami nadrzędnymi innymi niż Codex.
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

W przypadku środowisk uruchomieniowych i dostawców, którzy nie obsługują natywnego wyszukiwania Codex, Codex może
używać zarządzanego mechanizmu zastępczego `web_search` za pośrednictwem przestrzeni nazw dynamicznych narzędzi OpenClaw.
Użyj jawnie wskazanego zarządzanego dostawcy, gdy zamiast wyszukiwania hostowanego przez Codex potrzebujesz
kontroli sieciowych właściwych dla dostawcy OpenClaw.

Wybranie `provider: "codex"` włącza dołączony plugin `codex` i stosuje
te same ograniczenia `tools.web.search.openaiCodex`, które pokazano powyżej. Najpierw uwierzytelnij
serwer aplikacji Codex poleceniem `openclaw models auth login --provider openai`.
Agent nadrzędny może używać dowolnego modelu lub środowiska uruchomieniowego; tylko ograniczony proces roboczy wyszukiwania
działa za pośrednictwem Codex.

## Bezpieczeństwo sieci

Wywołania dostawców zarządzanego HTTP `web_search` używają chronionej ścieżki pobierania OpenClaw,
ograniczonej do własnej nazwy hosta bieżącego dostawcy. Wyłącznie dla tej nazwy hosta
OpenClaw zezwala na odpowiedzi DNS typu fake-IP z Surge, Clash i sing-box w zakresach
`198.18.0.0/15` oraz `fc00::/7`. Inne prywatne adresy docelowe, local loopback, adresy lokalne dla łącza i
adresy metadanych pozostają zablokowane. Codex Hosted Search stanowi wyjątek:
jego ograniczony proces roboczy deleguje dostęp do sieci hostowanemu narzędziu `web_search`
serwera aplikacji Codex.

To automatyczne zezwolenie nie dotyczy dowolnych adresów URL `web_fetch`. W przypadku
`web_fetch` jawnie włącz `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` oraz
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` tylko wtedy, gdy Twój
zaufany serwer proxy jest właścicielem tych syntetycznych zakresów.

## Konfiguracja

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // domyślnie: true
        provider: "brave", // lub pomiń, aby użyć automatycznego wykrywania
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Konfiguracja właściwa dla dostawcy (klucze API, bazowe adresy URL, tryby) znajduje się w
`plugins.entries.<plugin>.config.webSearch.*`. Gemini może również ponownie wykorzystywać
`models.providers.google.apiKey` i `models.providers.google.baseUrl` jako mechanizmy zastępcze
o niższym priorytecie po dedykowanej konfiguracji wyszukiwania internetowego i `GEMINI_API_KEY`. Przykłady
znajdziesz na stronach dostawców.
Grok może również ponownie użyć profilu uwierzytelniania OAuth xAI utworzonego przez `openclaw models auth login
--provider xai --method oauth`; konfiguracja klucza API pozostaje mechanizmem zastępczym.

Wartość `tools.web.search.provider` jest weryfikowana względem identyfikatorów dostawców wyszukiwania internetowego
zadeklarowanych w manifestach dołączonych i zainstalowanych pluginów. Literówka taka jak `"brvae"`
powoduje błąd walidacji konfiguracji zamiast cichego przejścia do automatycznego wykrywania. Jeśli
skonfigurowany dostawca ma tylko nieaktualne ślady pluginu, takie jak pozostały blok
`plugins.entries.<plugin>` po odinstalowaniu pluginu innej firmy,
OpenClaw zachowuje odporność procesu uruchamiania i zgłasza ostrzeżenie, aby umożliwić ponowną instalację
pluginu lub uruchomienie `openclaw doctor --fix` w celu wyczyszczenia nieaktualnej konfiguracji.

Wybór dostawcy mechanizmu zastępczego `web_fetch` odbywa się osobno:

- wybierz go za pomocą `tools.web.fetch.provider`
- albo pomiń to pole i pozwól OpenClaw automatycznie wykryć pierwszego gotowego dostawcę web-fetch
  na podstawie skonfigurowanych danych uwierzytelniających
- `web_fetch` poza piaskownicą może używać zainstalowanych dostawców pluginów, którzy deklarują
  `contracts.webFetchProviders`; pobieranie w piaskownicy dopuszcza dołączonych dostawców oraz
  zweryfikowane instalacje oficjalnych pluginów, ale wyklucza zewnętrzne pluginy innych firm
- oficjalny plugin Firecrawl jest obecnie jedynym dołączonym dostawcą
  `webFetchProviders` i konfiguruje się go w
  `plugins.entries.firecrawl.config.webFetch.*`

Gdy podczas `openclaw onboard` lub
`openclaw configure --section web` wybierzesz **Kimi**, OpenClaw może również zapytać o:

- region API Moonshot (`https://api.moonshot.ai/v1` lub `https://api.moonshot.cn/v1`)
- domyślny model wyszukiwania internetowego Kimi (domyślnie `kimi-k2.6`)

Dla `x_search` skonfiguruj `plugins.entries.xai.config.xSearch.*`. Używa on
tego samego profilu uwierzytelniania xAI co czat albo `XAI_API_KEY` / danych uwierzytelniających
wyszukiwania internetowego pluginu używanych przez wyszukiwanie internetowe Grok.
Starsza konfiguracja `tools.web.x_search.*` jest automatycznie migrowana przez `openclaw doctor --fix`.
Gdy podczas `openclaw onboard` lub `openclaw configure --section web` wybierzesz Grok,
OpenClaw oferuje również opcjonalną konfigurację `x_search` z tymi samymi danymi uwierzytelniającymi bezpośrednio
po zakończeniu konfiguracji Grok. Jest to osobny kolejny krok w ścieżce Grok,
a nie osobny wybór dostawcy wyszukiwania internetowego najwyższego poziomu. Jeśli wybierzesz innego
dostawcę, OpenClaw nie wyświetli monitu `x_search`.

### Przechowywanie kluczy API

<Tabs>
  <Tab title="Plik konfiguracyjny">
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
    Ustaw zmienną środowiskową dostawcy w środowisku procesu Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    W przypadku instalacji Gateway umieść ją w `~/.openclaw/.env`.
    Zobacz [Zmienne środowiskowe](/pl/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Parametry narzędzia

| Parametr              | Opis                                                               |
| --------------------- | ------------------------------------------------------------------ |
| `query`               | Zapytanie wyszukiwania (wymagane)                                  |
| `count`               | Liczba zwracanych wyników (1–10, domyślnie: 5)                     |
| `country`             | Dwuliterowy kod kraju ISO (np. "US", "DE")                         |
| `language`            | Kod języka ISO 639-1 (np. "en", "de")                              |
| `search_lang`         | Kod języka wyszukiwania (tylko Brave)                              |
| `freshness`           | Filtr czasu: `day`, `week`, `month` lub `year`                     |
| `date_after`          | Wyniki po tej dacie (RRRR-MM-DD)                                   |
| `date_before`         | Wyniki przed tą datą (RRRR-MM-DD)                                  |
| `ui_lang`             | Kod języka interfejsu użytkownika (tylko Brave)                    |
| `domain_filter`       | Tablica dozwolonych/zabronionych domen (tylko Perplexity)          |
| `max_tokens`          | Łączny budżet tokenów treści, tylko natywne API Perplexity Search  |
| `max_tokens_per_page` | Limit tokenów wyodrębniania na stronę, tylko natywne API Perplexity Search |

<Warning>
  Nie wszystkie parametry działają ze wszystkimi dostawcami. Tryb `llm-context` Brave
  odrzuca `ui_lang`; `date_before` wymaga również `date_after`, ponieważ niestandardowe
  zakresy aktualności Brave wymagają daty początkowej i końcowej.
  Gemini, Grok i Kimi zwracają jedną zsyntetyzowaną odpowiedź z cytowaniami. Akceptują
  `count` dla zgodności ze wspólnym narzędziem, ale nie zmienia on postaci
  odpowiedzi opartej na źródłach. Gemini traktuje aktualność `day` jako wskazówkę niedawności; szersze
  wartości aktualności i jawne daty ustawiają zakresy czasu ugruntowania wyszukiwania Google Search.
  Perplexity zachowuje się tak samo podczas używania ścieżki zgodności Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` lub `OPENROUTER_API_KEY`); ta ścieżka usuwa również obsługę `max_tokens` i
  `max_tokens_per_page`.
  SearXNG akceptuje `http://` tylko dla zaufanych hostów sieci prywatnej lub local loopback;
  publiczne punkty końcowe SearXNG muszą używać `https://`.
  Firecrawl i Tavily obsługują przez `web_search` tylko `query` i `count`
  — w przypadku opcji zaawansowanych użyj ich dedykowanych narzędzi.
</Warning>

## x_search

`x_search` przeszukuje wpisy w X (dawniej Twitter) za pomocą xAI i zwraca
odpowiedzi zsyntetyzowane przez AI wraz z cytowaniami. Akceptuje zapytania w języku naturalnym i
opcjonalne filtry strukturalne. OpenClaw tworzy wbudowane narzędzie xAI `x_search`
dla każdego żądania, zamiast utrzymywać je jako stale zarejestrowane, dlatego jest ono
aktywne tylko w turze, która faktycznie je wywołuje.

<Warning>
  `x_search` działa na serwerach xAI. xAI nalicza 5 USD za 1000 wywołań narzędzia, oprócz
  tokenów wejściowych i wyjściowych modelu.
</Warning>

<Note>
  Według dokumentacji xAI `x_search` obsługuje wyszukiwanie według słów kluczowych, wyszukiwanie semantyczne, wyszukiwanie
  użytkowników i pobieranie wątków. W przypadku statystyk zaangażowania poszczególnych wpisów, takich jak ponowne
  udostępnienia, odpowiedzi, zakładki lub wyświetlenia, preferuj ukierunkowane wyszukiwanie dokładnego adresu URL wpisu
  lub identyfikatora statusu. Szerokie wyszukiwania według słów kluczowych mogą znaleźć właściwy wpis, ale zwrócić mniej
  kompletne metadane poszczególnego wpisu. Dobra praktyka: najpierw znajdź wpis, a następnie
  uruchom drugie zapytanie `x_search` skoncentrowane na dokładnie tym wpisie.
</Note>

### Konfiguracja x_search

Gdy pominięto `enabled`, narzędzie `x_search` jest udostępniane tylko wtedy, gdy dostawcą aktywnego modelu jest `xai` i można uzyskać dane uwierzytelniające xAI. W przypadku aktywnego modelu ze znanym dostawcą innym niż xAI ustaw `plugins.entries.xai.config.xSearch.enabled` na `true`, aby włączyć używanie między dostawcami. Jeśli dostawca aktywnego modelu nie jest określony lub nie można go rozpoznać, narzędzie pozostaje ukryte. Ustaw `enabled` na `false`, aby wyłączyć je dla każdego dostawcy. Dane uwierzytelniające xAI są zawsze wymagane.

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // wymagane dla znanego dostawcy modelu innego niż xAI
            model: "grok-4.3",
            baseUrl: "https://api.x.ai/v1", // opcjonalne, zastępuje webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // opcjonalne, jeśli ustawiono profil uwierzytelniania xAI lub XAI_API_KEY
            baseUrl: "https://api.x.ai/v1", // opcjonalny, współdzielony bazowy adres URL xAI Responses
          },
        },
      },
    },
  },
}
```

Narzędzie `x_search` wysyła żądania POST do `<baseUrl>/responses`, gdy ustawiono `plugins.entries.xai.config.xSearch.baseUrl`. Jeśli to pole pominięto, używane są kolejno `plugins.entries.xai.config.webSearch.baseUrl`, starsze ustawienie `tools.web.search.grok.baseUrl`, a na końcu publiczny punkt końcowy xAI (`https://api.x.ai/v1`).

### Parametry x_search

| Parametr                     | Opis                                                            |
| ---------------------------- | --------------------------------------------------------------- |
| `query`                      | Zapytanie wyszukiwania (wymagane)                               |
| `allowed_x_handles`          | Ogranicza wyniki do maksymalnie 20 nazw użytkowników X           |
| `excluded_x_handles`         | Wyklucza maksymalnie 20 nazw użytkowników X                      |
| `from_date`                  | Uwzględnia tylko wpisy opublikowane tego dnia lub później (RRRR-MM-DD) |
| `to_date`                    | Uwzględnia tylko wpisy opublikowane tego dnia lub wcześniej (RRRR-MM-DD) |
| `enable_image_understanding` | Pozwala xAI analizować obrazy dołączone do pasujących wpisów     |
| `enable_video_understanding` | Pozwala xAI analizować filmy dołączone do pasujących wpisów      |

`allowed_x_handles` i `excluded_x_handles` wzajemnie się wykluczają.

### Przykład x_search

```javascript
await x_search({
  query: "przepisy na kolację",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Statystyki poszczególnych wpisów: w miarę możliwości użyj dokładnego adresu URL statusu lub identyfikatora statusu
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Przykłady

```javascript
// Podstawowe wyszukiwanie
await web_search({ query: "SDK pluginów OpenClaw" });

// Wyszukiwanie dotyczące języka niemieckiego
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Najnowsze wyniki (z ostatniego tygodnia)
await web_search({ query: "rozwój sztucznej inteligencji", freshness: "week" });

// Zakres dat
await web_search({
  query: "badania nad klimatem",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Filtrowanie domen (tylko Perplexity)
await web_search({
  query: "recenzje produktów",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Profile narzędzi

Jeśli używasz profili narzędzi lub list dozwolonych elementów, dodaj `web_search`, `x_search` lub `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // lub: allow: ["group:web"]  (obejmuje web_search, x_search i web_fetch)
  },
}
```

## Powiązane

- [Pobieranie treści internetowych](/pl/tools/web-fetch) -- pobieranie adresu URL i wyodrębnianie treści możliwej do odczytania
- [Przeglądarka internetowa](/pl/tools/browser) -- pełna automatyzacja przeglądarki dla witryn intensywnie korzystających z JS
- [Wyszukiwanie Grok](/pl/tools/grok-search) -- Grok jako dostawca `web_search`
- [Wyszukiwanie internetowe Ollama](/pl/tools/ollama-search) -- wyszukiwanie internetowe bez klucza za pośrednictwem hosta Ollama
