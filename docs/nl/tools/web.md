---
read_when:
    - Je wilt web_search inschakelen of configureren
    - Je wilt x_search inschakelen of configureren
    - Je moet een zoekprovider kiezen
    - Je wilt automatische detectie en providerselectie begrijpen
sidebarTitle: Web Search
summary: web_search, x_search en web_fetch -- doorzoek het web, doorzoek X-berichten of haal pagina-inhoud op
title: Webzoekopdracht
x-i18n:
    generated_at: "2026-06-27T18:31:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a448de6760546863b840118ab04fec8ef4b3213c124a7f229ffe67536327f9a4
    source_path: tools/web.md
    workflow: 16
---

De tool `web_search` doorzoekt het web met je geconfigureerde provider en
retourneert resultaten. Resultaten worden per query 15 minuten gecachet
(configureerbaar).

OpenClaw bevat ook `x_search` voor X-posts (voorheen Twitter) en
`web_fetch` voor lichtgewicht URL-ophaling. In deze fase blijft `web_fetch`
lokaal, terwijl `web_search` en `x_search` onder de motorkap xAI Responses
kunnen gebruiken.

<Info>
  `web_search` is een lichtgewicht HTTP-tool, geen browserautomatisering. Gebruik
  voor sites met veel JS of aanmeldingen de [Webbrowser](/nl/tools/browser). Gebruik
  voor het ophalen van een specifieke URL [Web Fetch](/nl/tools/web-fetch).
</Info>

## Snel starten

<Steps>
  <Step title="Choose a provider">
    Kies een provider en voltooi eventuele vereiste configuratie. Sommige providers
    zijn zonder sleutel, terwijl andere API-sleutels gebruiken. Zie de providerpagina's hieronder voor
    details.
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    Hiermee worden de provider en eventuele benodigde referenties opgeslagen. Je kunt ook een env
    var instellen (bijvoorbeeld `BRAVE_API_KEY`) en deze stap overslaan voor API-ondersteunde
    providers.
  </Step>
  <Step title="Use it">
    De agent kan nu `web_search` aanroepen:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Gebruik voor X-posts:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Een provider kiezen

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/nl/tools/brave-search">
    Gestructureerde resultaten met fragmenten. Ondersteunt de modus `llm-context` en land-/taalfilters. Gratis laag beschikbaar.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/nl/plugins/codex-harness">
    Door AI gesynthetiseerde, onderbouwde antwoorden via je Codex app-server-account.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/nl/tools/duckduckgo-search">
    Provider zonder sleutel. Geen API-sleutel nodig. Onofficiële HTML-gebaseerde integratie.
  </Card>
  <Card title="Exa" icon="brain" href="/nl/tools/exa-search">
    Neurale + trefwoordzoekopdracht met contentextractie (highlights, tekst, samenvattingen).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/nl/tools/firecrawl">
    Gestructureerde resultaten. Het best gecombineerd met `firecrawl_search` en `firecrawl_scrape` voor diepe extractie.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/nl/tools/gemini-search">
    Door AI gesynthetiseerde antwoorden met citaties via Google Search grounding.
  </Card>
  <Card title="Grok" icon="zap" href="/nl/tools/grok-search">
    Door AI gesynthetiseerde antwoorden met citaties via xAI web grounding.
  </Card>
  <Card title="Kimi" icon="moon" href="/nl/tools/kimi-search">
    Door AI gesynthetiseerde antwoorden met citaties via Moonshot-webzoekopdracht; ongegronde chat-fallbacks mislukken expliciet.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/nl/tools/minimax-search">
    Gestructureerde resultaten via de zoek-API van het MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/nl/tools/ollama-search">
    Zoek via een aangemelde lokale Ollama-host of de gehoste Ollama-API.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/nl/tools/parallel-search">
    Betaalde Parallel Search-API (`PARALLEL_API_KEY`); hogere snelheidslimieten en doelgerichte afstemming.
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/nl/tools/parallel-search">
    Opt-in zonder sleutel. Parallel's gratis Search MCP, met voor LLM geoptimaliseerde dichte fragmenten en geen API-sleutel.
  </Card>
  <Card title="Perplexity" icon="search" href="/nl/tools/perplexity-search">
    Gestructureerde resultaten met controles voor contentextractie en domeinfiltering.
  </Card>
  <Card title="SearXNG" icon="server" href="/nl/tools/searxng-search">
    Zelfgehoste metazoekmachine. Geen API-sleutel nodig. Aggregeert Google, Bing, DuckDuckGo en meer.
  </Card>
  <Card title="Tavily" icon="globe" href="/nl/tools/tavily">
    Gestructureerde resultaten met zoekdiepte, onderwerpfiltering en `tavily_extract` voor URL-extractie.
  </Card>
</CardGroup>

### Providervergelijking

| Provider                                         | Resultaatstijl                                                | Filters                                          | API-sleutel                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/nl/tools/brave-search)                     | Gestructureerde fragmenten                                    | Land, taal, tijd, modus `llm-context`            | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/nl/plugins/codex-harness)    | Door AI gesynthetiseerd + bron-URL's                          | Domeinen, contextgrootte, gebruikerslocatie      | Geen; gebruikt Codex/OpenAI-aanmelding                                                  |
| [DuckDuckGo](/nl/tools/duckduckgo-search)           | Gestructureerde fragmenten                                    | --                                               | Geen (zonder sleutel)                                                                   |
| [Exa](/nl/tools/exa-search)                         | Gestructureerd + geëxtraheerd                                 | Neurale/trefwoordmodus, datum, contentextractie  | `EXA_API_KEY`                                                                           |
| [Firecrawl](/nl/tools/firecrawl)                    | Gestructureerde fragmenten                                    | Via de tool `firecrawl_search`                   | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/nl/tools/gemini-search)                   | Door AI gesynthetiseerd + citaties                            | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/nl/tools/grok-search)                       | Door AI gesynthetiseerd + citaties                            | --                                               | xAI OAuth, `XAI_API_KEY` of `plugins.entries.xai.config.webSearch.apiKey`               |
| [Kimi](/nl/tools/kimi-search)                       | Door AI gesynthetiseerd + citaties; mislukt bij ongegronde chat-fallbacks | --                                      | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/nl/tools/minimax-search)          | Gestructureerde fragmenten                                    | Regio (`global` / `cn`)                          | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/nl/tools/ollama-search)        | Gestructureerde fragmenten                                    | --                                               | Geen voor aangemelde lokale hosts; `OLLAMA_API_KEY` voor directe `https://ollama.com`-zoekopdracht |
| [Parallel](/nl/tools/parallel-search)               | Dichte fragmenten gerangschikt voor LLM-context               | --                                               | `PARALLEL_API_KEY` (betaald)                                                            |
| [Parallel Search (Free)](/nl/tools/parallel-search) | Dichte fragmenten gerangschikt voor LLM-context               | --                                               | Geen (gratis Search MCP)                                                                |
| [Perplexity](/nl/tools/perplexity-search)           | Gestructureerde fragmenten                                    | Land, taal, tijd, domeinen, contentlimieten      | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/nl/tools/searxng-search)                 | Gestructureerde fragmenten                                    | Categorieën, taal                                | Geen (zelfgehost)                                                                       |
| [Tavily](/nl/tools/tavily)                          | Gestructureerde fragmenten                                    | Via de tool `tavily_search`                      | `TAVILY_API_KEY`                                                                        |

## Automatische detectie

## Native OpenAI-webzoekopdracht

Directe OpenAI Responses-modellen gebruiken automatisch OpenAI's gehoste tool `web_search` wanneer OpenClaw-webzoekopdracht is ingeschakeld en er geen beheerde provider is vastgezet. Dit is provider-eigen gedrag in de gebundelde OpenAI-Plugin en geldt alleen voor native OpenAI API-verkeer, niet voor OpenAI-compatibele proxybasis-URL's of Azure-routes. Stel `tools.web.search.provider` in op een andere provider zoals `brave` om de beheerde tool `web_search` voor OpenAI-modellen te behouden, of stel `tools.web.search.enabled: false` in om zowel beheerde zoekopdracht als native OpenAI-zoekopdracht uit te schakelen.

## Native Codex-webzoekopdracht

De runtime van de Codex app-server gebruikt automatisch Codex's gehoste tool `web_search`
wanneer webzoekopdracht is ingeschakeld en er geen beheerde provider is geselecteerd. Native gehoste
zoekopdracht en OpenClaw's beheerde dynamische tool `web_search` sluiten elkaar uit,
dus beheerde zoekopdracht kan native domeinbeperkingen niet omzeilen. OpenClaw gebruikt de
beheerde tool wanneer gehoste zoekopdracht niet beschikbaar is, expliciet is uitgeschakeld of
is vervangen door een geselecteerde beheerde provider. OpenClaw houdt Codex's zelfstandige
`web.run`-extensie uitgeschakeld omdat productie app-server-verkeer de
door de gebruiker gedefinieerde namespace `web` weigert.

- Configureer native zoekopdracht onder `tools.web.search.openaiCodex`
- Stel `tools.web.search.provider: "codex"` in om Codex Hosted Search in te richten als
  de beheerde `web_search`-provider voor elk bovenliggend model. Elke aanroep voert een
  begrensde tijdelijke Codex app-server-turn uit en mislukt als Codex geen gehost
  `webSearch`-item emitteert.
- `mode: "cached"` is de standaardvoorkeur, maar Codex vertaalt dit naar live
  externe toegang voor onbeperkte app-server-turns; stel `"live"` in om
  expliciet live toegang aan te vragen
- Stel `tools.web.search.provider` in op een beheerde provider zoals `brave` om
  in plaats daarvan OpenClaw's beheerde `web_search` te gebruiken
- Stel `tools.web.search.openaiCodex.enabled: false` in om af te zien van door Codex gehoste
  zoekopdracht; andere beheerde providers blijven beschikbaar
- Het beperken van het native tool-oppervlak van Codex houdt ook beheerde `web_search`
  beschikbaar
- Wanneer `allowedDomains` is ingesteld, mislukt automatische beheerde fallback gesloten als
  gehoste zoekopdracht niet beschikbaar is, zodat de native allowlist niet kan worden omzeild
- Tool-uitgeschakelde LLM-only-runs schakelen zowel native als beheerde zoekopdracht uit
- `tools.web.search.enabled: false` schakelt zowel beheerde als native zoekopdracht uit

Persistente effectieve wijzigingen in het Codex-zoekbeleid starten een nieuwe gebonden thread, zodat
een al geladen app-server-thread geen verouderde toegang tot gehoste zoekopdracht kan behouden.
Tijdelijke beperkingen per turn gebruiken een tijdelijke beperkte thread en behouden
de bestaande binding voor latere hervatting.

Direct OpenAI ChatGPT Responses-verkeer kan ook OpenAI's gehoste
tool `web_search` gebruiken. Dat afzonderlijke pad blijft opt-in via
`tools.web.search.openaiCodex.enabled: true` en geldt alleen voor geschikte
`openai/*`-modellen die `api: "openai-chatgpt-responses"` gebruiken.

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

Voor runtimes en providers die geen native Codex-zoekopdracht ondersteunen, kan Codex
de beheerde `web_search`-fallback gebruiken via OpenClaw's dynamische tool-namespace.
Gebruik een expliciete beheerde provider wanneer je OpenClaw's provider-specifieke
netwerkcontroles nodig hebt in plaats van door Codex gehoste zoekopdracht.

Door `provider: "codex"` te selecteren, schakel je de gebundelde `codex`-plugin in en worden de
zelfde hierboven getoonde beperkingen voor `tools.web.search.openaiCodex` gebruikt. Authenticeer de
Codex app-server eerst met `openclaw models auth login --provider openai`.
De bovenliggende agent kan elk model of elke runtime gebruiken; alleen de begrensde zoekworker
draait via Codex.

## Netwerkveiligheid

Beheerde HTTP-aanroepen naar de `web_search`-provider gebruiken het afgeschermde fetch-pad van OpenClaw. Voor
vertrouwde API-hosts van providers staat OpenClaw Surge-, Clash- en sing-box-fake-IP-
DNS-antwoorden in `198.18.0.0/15` en `fc00::/7` alleen toe voor die provider-hostnaam.
Andere private, loopback-, link-local- en metadata-bestemmingen blijven geblokkeerd.
Codex Hosted Search is de uitzondering: de begrensde worker delegeert netwerktoegang
aan de gehoste `web_search`-tool van de Codex app-server.

Deze automatische toelating geldt niet voor willekeurige `web_fetch`-URL's. Schakel voor
`web_fetch` `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` en
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` alleen expliciet in wanneer je
vertrouwde proxy eigenaar is van die synthetische bereiken.

## Webzoekfunctie instellen

Providerlijsten in documentatie en setupflows staan op alfabetische volgorde. Automatische detectie behoudt een
aparte volgorde van prioriteit.

Als er geen `provider` is ingesteld, controleert OpenClaw providers in deze volgorde en gebruikt het
de eerste die gereed is:

Eerst API-ondersteunde providers:

1. **Brave** -- `BRAVE_API_KEY` of `plugins.entries.brave.config.webSearch.apiKey` (volgorde 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` of `plugins.entries.minimax.config.webSearch.apiKey` (volgorde 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY`, of `models.providers.google.apiKey` (volgorde 20)
4. **Grok** -- xAI OAuth, `XAI_API_KEY`, of `plugins.entries.xai.config.webSearch.apiKey` (volgorde 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` of `plugins.entries.moonshot.config.webSearch.apiKey` (volgorde 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` of `plugins.entries.perplexity.config.webSearch.apiKey` (volgorde 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` of `plugins.entries.firecrawl.config.webSearch.apiKey` (volgorde 60)
8. **Exa** -- `EXA_API_KEY` of `plugins.entries.exa.config.webSearch.apiKey`; optioneel overschrijft `plugins.entries.exa.config.webSearch.baseUrl` het Exa-eindpunt (volgorde 65)
9. **Tavily** -- `TAVILY_API_KEY` of `plugins.entries.tavily.config.webSearch.apiKey` (volgorde 70)
10. **Parallel** -- betaalde Parallel Search API via `PARALLEL_API_KEY` of `plugins.entries.parallel.config.webSearch.apiKey`; optioneel overschrijft `plugins.entries.parallel.config.webSearch.baseUrl` het eindpunt (volgorde 75)

Daarna geconfigureerde eindpuntproviders:

11. **SearXNG** -- `SEARXNG_BASE_URL` of `plugins.entries.searxng.config.webSearch.baseUrl` (volgorde 200)

Providers zonder sleutel, zoals **Parallel Search (Free)**, **DuckDuckGo**,
**Ollama Web Search** en **Codex Hosted Search**, zijn alleen beschikbaar wanneer je
ze expliciet selecteert met `tools.web.search.provider` of via
`openclaw configure --section web`. OpenClaw stuurt beheerde
`web_search`-query's niet naar een provider zonder sleutel alleen omdat er geen API-ondersteunde provider
is geconfigureerd.

OpenAI Responses-modellen vormen een uitzondering: zolang `tools.web.search.provider` niet
is ingesteld, gebruiken ze de native webzoekfunctie van OpenAI in plaats van de beheerde providers
hierboven. Stel `tools.web.search.provider` in op `parallel-free` (of een andere provider)
om ze via het beheerde pad te routeren.

<Note>
  Alle provider-sleutelvelden ondersteunen SecretRef-objecten. Plugin-gescopeerde SecretRefs
  onder `plugins.entries.<plugin>.config.webSearch.apiKey` worden opgelost voor de
  geïnstalleerde API-ondersteunde webzoekproviders, waaronder Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity en Tavily,
  ongeacht of de provider expliciet via `tools.web.search.provider` wordt gekozen of
  via automatische detectie wordt geselecteerd. In automatische-detectiemodus lost OpenClaw alleen de
  geselecteerde providersleutel op -- niet-geselecteerde SecretRefs blijven inactief, zodat je
  meerdere providers geconfigureerd kunt houden zonder resolutiekosten te betalen voor de
  providers die je niet gebruikt.
</Note>

## Configuratie

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

Provider-specifieke configuratie (API-sleutels, basis-URL's, modi) staat onder
`plugins.entries.<plugin>.config.webSearch.*`. Gemini kan ook
`models.providers.google.apiKey` en `models.providers.google.baseUrl` opnieuw gebruiken als fallbacks met lagere prioriteit
na zijn specifieke webzoekconfiguratie en `GEMINI_API_KEY`. Zie de
providerpagina's voor voorbeelden.
Grok kan ook een xAI OAuth-authenticatieprofiel van `openclaw models auth login
--provider xai --method oauth` opnieuw gebruiken; API-sleutelconfiguratie blijft de fallback.

`tools.web.search.provider` wordt gevalideerd tegen de webzoekprovider-id's
die door gebundelde en geïnstalleerde pluginmanifesten zijn gedeclareerd. Een typefout zoals `"brvae"`
laat configuratievalidatie mislukken in plaats van stil terug te vallen op automatische detectie. Als een
geconfigureerde provider alleen verouderd pluginbewijs heeft, zoals een achtergebleven
`plugins.entries.<plugin>`-blok nadat een externe plugin van derden is verwijderd,
houdt OpenClaw het opstarten veerkrachtig en meldt het een waarschuwing zodat je de
plugin opnieuw kunt installeren of `openclaw doctor --fix` kunt uitvoeren om de verouderde configuratie op te ruimen.

Providerselectie voor `web_fetch`-fallback staat hier los van:

- kies deze met `tools.web.fetch.provider`
- of laat dat veld weg en laat OpenClaw automatisch de eerste gereedstaande web-fetch-
  provider uit geconfigureerde referenties detecteren
- niet-gesandboxte `web_fetch` kan geïnstalleerde pluginproviders gebruiken die
  `contracts.webFetchProviders` declareren; gesandboxte fetches staan gebundelde providers en
  geverifieerde officiële plugininstallaties toe, maar sluiten externe plugins van derden uit
- de officiële Firecrawl-plugin biedt web-fetch-fallback, geconfigureerd onder
  `plugins.entries.firecrawl.config.webFetch.*`

Wanneer je **Kimi** kiest tijdens `openclaw onboard` of
`openclaw configure --section web`, kan OpenClaw ook vragen om:

- de Moonshot API-regio (`https://api.moonshot.ai/v1` of `https://api.moonshot.cn/v1`)
- het standaardmodel voor Kimi-webzoekopdrachten (standaard `kimi-k2.6`)

Configureer voor `x_search` `plugins.entries.xai.config.xSearch.*`. Het gebruikt hetzelfde
xAI-authenticatieprofiel als chat, of de `XAI_API_KEY` / plugin-webzoekreferentie
die door Grok-webzoekfunctie wordt gebruikt.
Verouderde `tools.web.x_search.*`-configuratie wordt automatisch gemigreerd door `openclaw doctor --fix`.
Wanneer je Grok kiest tijdens `openclaw onboard` of `openclaw configure --section web`,
kan OpenClaw ook optionele `x_search`-setup aanbieden met dezelfde referentie.
Dit is een aparte vervolgstap binnen het Grok-pad, geen aparte keuze voor een webzoekprovider op topniveau.
Als je een andere provider kiest, toont OpenClaw de `x_search`-prompt niet.

### API-sleutels opslaan

<Tabs>
  <Tab title="Config file">
    Voer `openclaw configure --section web` uit of stel de sleutel direct in:

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
    Stel de provider-env-var in de Gateway-procesomgeving in:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Zet deze voor een gateway-installatie in `~/.openclaw/.env`.
    Zie [Env-vars](/nl/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Toolparameters

| Parameter             | Beschrijving                                          |
| --------------------- | ----------------------------------------------------- |
| `query`               | Zoekquery (verplicht)                                 |
| `count`               | Terug te geven resultaten (1-10, standaard: 5)        |
| `country`             | ISO-landcode van 2 letters (bijv. "US", "DE")        |
| `language`            | ISO 639-1-taalcode (bijv. "en", "de")                |
| `search_lang`         | Zoektaalcode (alleen Brave)                           |
| `freshness`           | Tijdfilter: `day`, `week`, `month`, of `year`         |
| `date_after`          | Resultaten na deze datum (YYYY-MM-DD)                 |
| `date_before`         | Resultaten vóór deze datum (YYYY-MM-DD)               |
| `ui_lang`             | UI-taalcode (alleen Brave)                            |
| `domain_filter`       | Domein-allowlist/denylist-array (alleen Perplexity)   |
| `max_tokens`          | Totale contentbudget, standaard 25000 (alleen Perplexity) |
| `max_tokens_per_page` | Tokenlimiet per pagina, standaard 2048 (alleen Perplexity) |

<Warning>
  Niet alle parameters werken met alle providers. Brave `llm-context`-modus
  weigert `ui_lang`; `date_before` heeft ook `date_after` nodig omdat aangepaste Brave-
  freshness-bereiken zowel begin- als einddatums vereisen.
  Gemini, Grok en Kimi retourneren één gesynthetiseerd antwoord met citaties. Ze
  accepteren `count` voor compatibiliteit met gedeelde tools, maar het verandert de
  vorm van het grounded antwoord niet. Gemini behandelt `day`-freshness als een recency-hint; bredere
  freshness-waarden en expliciete datums stellen tijdbereiken voor Google Search-grounding in.
  Perplexity gedraagt zich op dezelfde manier wanneer je het Sonar/OpenRouter-
  compatibiliteitspad gebruikt (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` of `OPENROUTER_API_KEY`).
  SearXNG accepteert `http://` alleen voor vertrouwde private-netwerk- of loopback-hosts;
  openbare SearXNG-eindpunten moeten `https://` gebruiken.
  Firecrawl en Tavily ondersteunen alleen `query` en `count` via `web_search`
  -- gebruik hun specifieke tools voor geavanceerde opties.
</Warning>

## x_search

`x_search` doorzoekt X-berichten (voorheen Twitter) met xAI en retourneert
AI-gesynthetiseerde antwoorden met citaties. Het accepteert query's in natuurlijke taal en
optionele gestructureerde filters. OpenClaw schakelt de ingebouwde xAI `x_search`-
tool alleen in voor het verzoek dat deze toolaanroep bedient.

<Note>
  xAI documenteert `x_search` als ondersteuning voor keyword search, semantic search, user
  search en thread fetch. Voor engagementstatistieken per bericht, zoals reposts,
  antwoorden, bladwijzers of weergaven, verdient een gerichte lookup voor de exacte bericht-URL
  of status-ID de voorkeur. Brede zoekopdrachten op trefwoorden kunnen het juiste bericht vinden, maar retourneren minder
  volledige metadata per bericht. Een goed patroon is: lokaliseer eerst het bericht en voer daarna
  een tweede `x_search`-query uit die op dat exacte bericht is gericht.
</Note>

### x_search-configuratie

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

`x_search` post naar `<baseUrl>/responses` wanneer
`plugins.entries.xai.config.xSearch.baseUrl` is ingesteld. Als dat veld wordt weggelaten,
valt het terug op `plugins.entries.xai.config.webSearch.baseUrl`, daarna op de
verouderde `tools.web.search.grok.baseUrl` en ten slotte op het openbare xAI-eindpunt.

### x_search-parameters

| Parameter                    | Beschrijving                                           |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Zoekopdracht (vereist)                                 |
| `allowed_x_handles`          | Beperk resultaten tot specifieke X-handles             |
| `excluded_x_handles`         | Sluit specifieke X-handles uit                         |
| `from_date`                  | Neem alleen berichten op vanaf deze datum (YYYY-MM-DD) |
| `to_date`                    | Neem alleen berichten op tot en met deze datum (YYYY-MM-DD) |
| `enable_image_understanding` | Laat xAI afbeeldingen inspecteren die aan overeenkomende berichten zijn gekoppeld |
| `enable_video_understanding` | Laat xAI video's inspecteren die aan overeenkomende berichten zijn gekoppeld |

### x_search-voorbeeld

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

## Voorbeelden

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

## Toolprofielen

Als je toolprofielen of toelatingslijsten gebruikt, voeg dan `web_search`, `x_search` of `group:web` toe:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Gerelateerd

- [Web ophalen](/nl/tools/web-fetch) -- haal een URL op en extraheer leesbare inhoud
- [Webbrowser](/nl/tools/browser) -- volledige browserautomatisering voor sites met veel JS
- [Grok Search](/nl/tools/grok-search) -- Grok als de `web_search`-provider
- [Ollama-webzoekopdracht](/nl/tools/ollama-search) -- webzoekopdrachten zonder sleutel via je Ollama-host
