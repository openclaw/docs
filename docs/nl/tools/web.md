---
read_when:
    - U wilt web_search inschakelen of configureren
    - Je wilt x_search inschakelen of configureren
    - Je moet een zoekprovider kiezen
    - Je wilt automatische detectie en providerselectie begrijpen
sidebarTitle: Web Search
summary: web_search, x_search en web_fetch -- doorzoek het web, doorzoek berichten op X of haal pagina-inhoud op
title: Zoeken op internet
x-i18n:
    generated_at: "2026-07-12T09:26:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58db549f5133a98a2ee9514f570ba8bd99b793e912ed3e0da296f454c88692a7
    source_path: tools/web.md
    workflow: 16
---

`web_search` doorzoekt het web met uw geconfigureerde provider en retourneert
genormaliseerde resultaten, die per zoekopdracht 15 minuten in de cache worden
bewaard (configureerbaar). OpenClaw bevat ook `x_search` voor berichten op X
(voorheen Twitter) en `web_fetch` voor het lichtgewicht ophalen van URL's.
`web_fetch` wordt altijd lokaal uitgevoerd; `web_search` wordt via xAI Responses
geleid wanneer Grok de provider is, en `x_search` gebruikt altijd xAI Responses.

<Info>
  `web_search` is een lichtgewicht HTTP-hulpmiddel, geen browserautomatisering.
  Gebruik voor sites die sterk op JS steunen of aanmeldingen de
  [webbrowser](/nl/tools/browser). Gebruik [Web Fetch](/nl/tools/web-fetch) om een
  specifieke URL op te halen.
</Info>

## Snel aan de slag

<Steps>
  <Step title="Kies een provider">
    Kies een provider en voltooi eventuele vereiste configuratie. Sommige
    providers vereisen geen sleutel, andere hebben een API-sleutel nodig. Zie
    de onderstaande providerpagina's voor meer informatie.
  </Step>
  <Step title="Configureren">
    ```bash
    openclaw configure --section web
    ```
    Hiermee worden de provider en eventuele benodigde referenties opgeslagen.
    Voor providers met een API kunt u in plaats daarvan de omgevingsvariabele
    van de provider instellen (bijvoorbeeld `BRAVE_API_KEY`) en deze stap
    overslaan.
  </Step>
  <Step title="Gebruiken">
    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Voor berichten op X:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Een provider kiezen

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/nl/tools/brave-search">
    Gestructureerde resultaten met fragmenten. Ondersteunt de modus `llm-context` en land-/taalfilters. Er is een gratis niveau beschikbaar.
  </Card>
  <Card title="Door Codex gehoste zoekfunctie" icon="search" href="/nl/plugins/codex-harness">
    Door AI samengestelde, onderbouwde antwoorden via uw Codex-appserveraccount.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/nl/tools/duckduckgo-search">
    Provider zonder sleutel. Geen API-sleutel nodig. Onofficiële integratie op basis van HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/nl/tools/exa-search">
    Neuraal zoeken en zoeken op trefwoorden met inhoudsextractie (markeringen, tekst, samenvattingen).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/nl/tools/firecrawl">
    Gestructureerde resultaten. Werkt het beste in combinatie met `firecrawl_search` en `firecrawl_scrape` voor grondige extractie.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/nl/tools/gemini-search">
    Door AI samengestelde antwoorden met bronvermeldingen via onderbouwing met Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/nl/tools/grok-search">
    Door AI samengestelde antwoorden met bronvermeldingen via webonderbouwing van xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/nl/tools/kimi-search">
    Door AI samengestelde antwoorden met bronvermeldingen via de webzoekfunctie van Moonshot; niet-onderbouwde terugvallen op chat mislukken expliciet.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/nl/tools/minimax-search">
    Gestructureerde resultaten via de zoek-API van het MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/nl/tools/ollama-search">
    Zoeken via een aangemelde lokale Ollama-host of de gehoste Ollama-API.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/nl/tools/parallel-search">
    Betaalde Parallel Search-API (`PARALLEL_API_KEY`); hogere frequentielimieten en doelgerichte afstemming.
  </Card>
  <Card title="Parallel Search (gratis)" icon="layer-group" href="/nl/tools/parallel-search">
    Optionele provider zonder sleutel. De gratis Search MCP van Parallel, met voor LLM's geoptimaliseerde compacte fragmenten en zonder API-sleutel.
  </Card>
  <Card title="Perplexity" icon="search" href="/nl/tools/perplexity-search">
    Gestructureerde resultaten met instellingen voor inhoudsextractie en domeinfiltering.
  </Card>
  <Card title="SearXNG" icon="server" href="/nl/tools/searxng-search">
    Zelfgehoste metazoekmachine. Geen API-sleutel nodig. Voegt resultaten van Google, Bing, DuckDuckGo en meer samen.
  </Card>
  <Card title="Tavily" icon="globe" href="/nl/tools/tavily">
    Gestructureerde resultaten met zoekdiepte, onderwerpfiltering en `tavily_extract` voor URL-extractie.
  </Card>
</CardGroup>

### Vergelijking van providers

| Provider                                         | Resultaatstijl                                                   | Filters                                          | API-sleutel                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/nl/tools/brave-search)                     | Gestructureerde fragmenten                                            | Land, taal, tijd, modus `llm-context`      | `BRAVE_API_KEY`                                                                         |
| [Door Codex gehoste zoekfunctie](/nl/plugins/codex-harness)    | Door AI samengesteld + bron-URL's                                   | Domeinen, contextgrootte, locatie van gebruiker             | Geen; gebruikt aanmelding bij Codex/OpenAI                                                         |
| [DuckDuckGo](/nl/tools/duckduckgo-search)           | Gestructureerde fragmenten                                            | --                                               | Geen (zonder sleutel)                                                                         |
| [Exa](/nl/tools/exa-search)                         | Gestructureerd + geëxtraheerd                                         | Neurale/trefwoordmodus, datum, inhoudsextractie    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/nl/tools/firecrawl)                    | Gestructureerde fragmenten                                            | Via het hulpmiddel `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/nl/tools/gemini-search)                   | Door AI samengesteld + bronvermeldingen                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/nl/tools/grok-search)                       | Door AI samengesteld + bronvermeldingen                                     | --                                               | xAI OAuth, `XAI_API_KEY` of `plugins.entries.xai.config.webSearch.apiKey`              |
| [Kimi](/nl/tools/kimi-search)                       | Door AI samengesteld + bronvermeldingen; mislukt bij niet-onderbouwde terugvallen op chat | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/nl/tools/minimax-search)          | Gestructureerde fragmenten                                            | Regio (`global` / `cn`)                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/nl/tools/ollama-search)        | Gestructureerde fragmenten                                            | --                                               | Geen voor aangemelde lokale hosts; `OLLAMA_API_KEY` voor rechtstreeks zoeken via `https://ollama.com` |
| [Parallel](/nl/tools/parallel-search)               | Compacte fragmenten gerangschikt voor LLM-context                          | --                                               | `PARALLEL_API_KEY` (betaald)                                                               |
| [Parallel Search (gratis)](/nl/tools/parallel-search) | Compacte fragmenten gerangschikt voor LLM-context                          | --                                               | Geen (gratis Search MCP)                                                                  |
| [Perplexity](/nl/tools/perplexity-search)           | Gestructureerde fragmenten                                            | Land, taal, tijd, domeinen, inhoudslimieten | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/nl/tools/searxng-search)                 | Gestructureerde fragmenten                                            | Categorieën, taal                             | Geen (zelfgehost)                                                                      |
| [Tavily](/nl/tools/tavily)                          | Gestructureerde fragmenten                                            | Via het hulpmiddel `tavily_search`                         | `TAVILY_API_KEY`                                                                        |

## Automatische detectie

Providerlijsten in documentatie en configuratieprocessen zijn alfabetisch
geordend. Automatische detectie gebruikt een afzonderlijke, vaste
prioriteitsvolgorde en kiest alleen een provider die referenties nodig heeft
(`requiresCredential !== false`) wanneer hiervoor een configuratie wordt
gevonden. Als er geen `provider` is ingesteld, controleert OpenClaw providers
in deze volgorde en gebruikt het de eerste die gereed is:

Eerst providers met een API:

1. **Brave** -- `BRAVE_API_KEY` of `plugins.entries.brave.config.webSearch.apiKey` (volgorde 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` of `plugins.entries.minimax.config.webSearch.apiKey` (volgorde 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` of `models.providers.google.apiKey` (volgorde 20)
4. **Grok** -- xAI OAuth, `XAI_API_KEY` of `plugins.entries.xai.config.webSearch.apiKey` (volgorde 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` of `plugins.entries.moonshot.config.webSearch.apiKey` (volgorde 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` of `plugins.entries.perplexity.config.webSearch.apiKey` (volgorde 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` of `plugins.entries.firecrawl.config.webSearch.apiKey` (volgorde 60)
8. **Exa** -- `EXA_API_KEY` of `plugins.entries.exa.config.webSearch.apiKey`; optioneel overschrijft `plugins.entries.exa.config.webSearch.baseUrl` het Exa-eindpunt (volgorde 65)
9. **Tavily** -- `TAVILY_API_KEY` of `plugins.entries.tavily.config.webSearch.apiKey` (volgorde 70)
10. **Parallel** -- betaalde Parallel Search-API via `PARALLEL_API_KEY` of `plugins.entries.parallel.config.webSearch.apiKey`; optioneel overschrijft `plugins.entries.parallel.config.webSearch.baseUrl` het eindpunt (volgorde 75)

Daarna providers met een geconfigureerd eindpunt:

11. **SearXNG** -- `SEARXNG_BASE_URL` of `plugins.entries.searxng.config.webSearch.baseUrl` (volgorde 200)

Providers zonder sleutel, zoals **Parallel Search (gratis)**, **DuckDuckGo**,
**Ollama Web Search** en **Door Codex gehoste zoekfunctie**, worden nooit door
automatische detectie gekozen, ook al hebben ze een interne volgordewaarde.
Ze worden alleen gebruikt wanneer u ze expliciet selecteert met
`tools.web.search.provider` of via `openclaw configure --section web`.
OpenClaw stuurt beheerde `web_search`-zoekopdrachten niet naar een provider
zonder sleutel alleen omdat er geen provider met een API is geconfigureerd.

OpenAI Responses-modellen vormen een uitzondering: zolang
`tools.web.search.provider` niet is ingesteld, gebruiken ze de ingebouwde
webzoekfunctie van OpenAI in plaats van de bovenstaande beheerde providers
(zie hieronder). Stel `tools.web.search.provider` in op `parallel-free` (of
een andere provider) om ze in plaats daarvan via het beheerde pad te leiden.

<Note>
  Alle sleutelvelden voor providers ondersteunen SecretRef-objecten.
  SecretRefs binnen een Plugin onder
  `plugins.entries.<plugin>.config.webSearch.apiKey` worden verwerkt voor de
  geïnstalleerde providers voor webzoekopdrachten met een API, waaronder Brave,
  Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity en Tavily,
  ongeacht of de provider expliciet wordt gekozen via
  `tools.web.search.provider` of via automatische detectie wordt geselecteerd.
  In de modus voor automatische detectie verwerkt OpenClaw alleen de sleutel
  van de geselecteerde provider; niet-geselecteerde SecretRefs blijven
  inactief, zodat u meerdere providers kunt configureren zonder kosten te maken
  voor het verwerken van de providers die u niet gebruikt.
</Note>

## Ingebouwde OpenAI-webzoekfunctie

Directe OpenAI Responses-modellen (`api: "openai-responses"`, provider `openai`,
geen basis-URL of een officiële basis-URL van de OpenAI API) gebruiken automatisch
OpenAI's gehoste `web_search`-tool wanneer OpenClaw-webzoekopdrachten zijn ingeschakeld
en er geen beheerde provider is vastgezet. Dit is gedrag dat eigendom is van de provider
in de gebundelde OpenAI-plugin en is niet van toepassing op basis-URL's van
OpenAI-compatibele proxy's of Azure-routes. Stel `tools.web.search.provider` in op een
andere provider, zoals `brave`, om de beheerde `web_search`-tool voor OpenAI-modellen te
behouden, of stel `tools.web.search.enabled: false` in om zowel beheerd zoeken als
systeemeigen zoeken van OpenAI uit te schakelen.

## Systeemeigen Codex-webzoekfunctie

De app-serverruntime van Codex gebruikt automatisch de gehoste `web_search`-tool van
Codex wanneer webzoeken is ingeschakeld en er geen beheerde provider is geselecteerd.
Systeemeigen gehost zoeken en de dynamische, beheerde `web_search`-tool van OpenClaw
sluiten elkaar uit, zodat beheerd zoeken de systeemeigen domeinbeperkingen niet kan
omzeilen. OpenClaw gebruikt de beheerde tool wanneer gehost zoeken niet beschikbaar is,
expliciet is uitgeschakeld of is vervangen door een geselecteerde beheerde provider.
OpenClaw houdt de zelfstandige `web.run`-extensie van Codex uitgeschakeld
(`features.standalone_web_search: false`), omdat productiegegevensverkeer van de
app-server de door gebruikers gedefinieerde `web`-naamruimte weigert.

- Configureer systeemeigen zoeken onder `tools.web.search.openaiCodex`
- Stel `tools.web.search.provider: "codex"` in om Codex Hosted Search in te richten als
  de beheerde `web_search`-provider voor elk bovenliggend model. Elke aanroep voert een
  begrensde, tijdelijke app-serverbeurt van Codex uit en mislukt als Codex geen gehost
  `webSearch`-item uitvoert.
- `mode: "cached"` is de standaardvoorkeur, maar Codex zet dit om in live externe
  toegang voor onbeperkte app-serverbeurten; stel `"live"` in om expliciet live toegang
  aan te vragen
- Stel `tools.web.search.provider` in op een beheerde provider zoals `brave` om in plaats
  daarvan de beheerde `web_search` van OpenClaw te gebruiken
- Stel `tools.web.search.openaiCodex.enabled: false` in om gehost zoeken via Codex uit te
  schakelen; andere beheerde providers blijven beschikbaar
- Door het systeemeigen tooloppervlak van Codex te beperken, blijft beheerde
  `web_search` ook beschikbaar
- Wanneer `allowedDomains` is ingesteld, wordt automatische beheerde terugval gesloten
  geweigerd als gehost zoeken niet beschikbaar is, zodat de systeemeigen acceptatielijst
  niet kan worden omzeild
- LLM-only-uitvoeringen met uitgeschakelde tools schakelen zowel systeemeigen als
  beheerd zoeken uit
- `tools.web.search.enabled: false` schakelt zowel beheerd als systeemeigen zoeken uit

Permanente wijzigingen in het effectieve Codex-zoekbeleid starten een nieuwe gebonden
thread, zodat een reeds geladen app-serverthread geen verouderde toegang tot gehost
zoeken kan behouden. Tijdelijke beperkingen per beurt gebruiken een tijdelijk beperkte
thread en behouden de bestaande binding om later te hervatten.

Direct OpenAI ChatGPT Responses-verkeer kan ook de gehoste `web_search`-tool van OpenAI
gebruiken. Dat afzonderlijke pad blijft opt-in via
`tools.web.search.openaiCodex.enabled: true` en is alleen van toepassing op geschikte
`openai/*`-modellen die `api: "openai-chatgpt-responses"` gebruiken.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Optioneel: gebruik Codex Hosted Search ook vanuit bovenliggende modellen die geen Codex-modellen zijn.
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

Voor runtimes en providers die systeemeigen zoeken via Codex niet ondersteunen, kan
Codex de beheerde `web_search`-terugval gebruiken via de dynamische toolnaamruimte van
OpenClaw. Gebruik een expliciete beheerde provider wanneer u de providerspecifieke
netwerkregelingen van OpenClaw nodig hebt in plaats van door Codex gehost zoeken.

Als u `provider: "codex"` selecteert, wordt de gebundelde `codex`-plugin ingeschakeld en
worden dezelfde hierboven getoonde beperkingen van
`tools.web.search.openaiCodex` gebruikt. Verifieer de identiteit van de Codex-app-server
eerst met `openclaw models auth login --provider openai`. De bovenliggende agent kan elk
model of elke runtime gebruiken; alleen de begrensde zoekworker wordt via Codex
uitgevoerd.

## Netwerkveiligheid

Beheerde HTTP-aanroepen van `web_search`-providers gebruiken het beveiligde ophaalpad
van OpenClaw, beperkt tot de eigen hostnaam van de huidige provider. Alleen voor die
hostnaam staat OpenClaw fake-IP-DNS-antwoorden van Surge, Clash en sing-box toe in
`198.18.0.0/15` en `fc00::/7`. Andere privé-, loopback-, link-local- en
metadatabestemmingen blijven geblokkeerd. Codex Hosted Search vormt de uitzondering:
de begrensde worker delegeert netwerktoegang aan de gehoste `web_search`-tool van de
Codex-app-server.

Deze automatische toestemming geldt niet voor willekeurige `web_fetch`-URL's. Schakel
voor `web_fetch` `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` en
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` alleen expliciet in wanneer uw
vertrouwde proxy eigenaar is van die synthetische bereiken.

## Configuratie

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // standaard: true
        provider: "brave", // of weglaten voor automatische detectie
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Providerspecifieke configuratie (API-sleutels, basis-URL's, modi) staat onder
`plugins.entries.<plugin>.config.webSearch.*`. Gemini kan ook
`models.providers.google.apiKey` en `models.providers.google.baseUrl` hergebruiken als
terugvalopties met lagere prioriteit, na de eigen configuratie voor webzoeken en
`GEMINI_API_KEY`. Zie de providerpagina's voor voorbeelden.
Grok kan ook een xAI OAuth-verificatieprofiel van `openclaw models auth login
--provider xai --method oauth` hergebruiken; configuratie met een API-sleutel blijft de
terugvaloptie.

`tools.web.search.provider` wordt gevalideerd aan de hand van de provider-ID's voor
webzoeken die zijn gedeclareerd door gebundelde en geïnstalleerde pluginmanifesten. Een
typefout zoals `"brvae"` zorgt ervoor dat de configuratievalidatie mislukt in plaats van
stil terug te vallen op automatische detectie. Als een geconfigureerde provider alleen
verouderd pluginbewijs heeft, zoals een achtergebleven
`plugins.entries.<plugin>`-blok na het verwijderen van een plugin van derden, blijft
OpenClaw robuust opstarten en meldt het een waarschuwing, zodat u de plugin opnieuw kunt
installeren of `openclaw doctor --fix` kunt uitvoeren om de verouderde configuratie op
te schonen.

De selectie van een terugvalprovider voor `web_fetch` staat hiervan los:

- kies deze met `tools.web.fetch.provider`
- of laat dat veld weg en laat OpenClaw automatisch de eerste gebruiksklare
  web-fetchprovider detecteren op basis van geconfigureerde referenties
- `web_fetch` zonder sandbox kan geïnstalleerde pluginproviders gebruiken die
  `contracts.webFetchProviders` declareren; ophaalacties in een sandbox staan
  gebundelde providers en geverifieerde installaties van officiële plugins toe, maar
  sluiten externe plugins van derden uit
- de officiële Firecrawl-plugin is momenteel de enige gebundelde bijdrager aan
  `webFetchProviders`, geconfigureerd onder
  `plugins.entries.firecrawl.config.webFetch.*`

Wanneer u tijdens `openclaw onboard` of
`openclaw configure --section web` **Kimi** kiest, kan OpenClaw ook vragen om:

- de Moonshot API-regio (`https://api.moonshot.ai/v1` of `https://api.moonshot.cn/v1`)
- het standaardmodel van Kimi voor webzoeken (standaard `kimi-k2.6`)

Configureer voor `x_search` `plugins.entries.xai.config.xSearch.*`. Dit gebruikt
hetzelfde xAI-verificatieprofiel als chat, of de `XAI_API_KEY` /
pluginreferentie voor webzoeken die door Grok-webzoeken wordt gebruikt.
Verouderde configuratie onder `tools.web.x_search.*` wordt automatisch gemigreerd door
`openclaw doctor --fix`.
Wanneer u Grok kiest tijdens `openclaw onboard` of `openclaw configure --section web`,
biedt OpenClaw ook optionele configuratie van `x_search` aan met dezelfde referentie,
direct nadat de Grok-configuratie is voltooid. Dit is een afzonderlijke vervolgstap
binnen het Grok-pad, geen afzonderlijke providerkeuze voor webzoeken op het hoogste
niveau. Als u een andere provider kiest, toont OpenClaw de `x_search`-vraag niet.

### API-sleutels opslaan

<Tabs>
  <Tab title="Configuratiebestand">
    Voer `openclaw configure --section web` uit of stel de sleutel rechtstreeks in:

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
  <Tab title="Omgevingsvariabele">
    Stel de omgevingsvariabele van de provider in de procesomgeving van de Gateway in:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Plaats deze voor een Gateway-installatie in `~/.openclaw/.env`.
    Zie [Omgevingsvariabelen](/nl/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Toolparameters

| Parameter             | Beschrijving                                                       |
| --------------------- | ------------------------------------------------------------------ |
| `query`               | Zoekopdracht (vereist)                                             |
| `count`               | Aantal te retourneren resultaten (1-10, standaard: 5)              |
| `country`             | ISO-landcode van 2 letters (bijv. "US", "DE")                      |
| `language`            | ISO 639-1-taalcode (bijv. "en", "de")                              |
| `search_lang`         | Taalcode voor zoeken (alleen Brave)                                |
| `freshness`           | Tijdsfilter: `day`, `week`, `month` of `year`                      |
| `date_after`          | Resultaten na deze datum (JJJJ-MM-DD)                              |
| `date_before`         | Resultaten vóór deze datum (JJJJ-MM-DD)                            |
| `ui_lang`             | Taalcode van de gebruikersinterface (alleen Brave)                 |
| `domain_filter`       | Array met acceptatie-/weigeringslijst voor domeinen (alleen Perplexity) |
| `max_tokens`          | Totaal tokenbudget voor inhoud, alleen systeemeigen Perplexity Search API |
| `max_tokens_per_page` | Tokenlimiet voor extractie per pagina, alleen systeemeigen Perplexity Search API |

<Warning>
  Niet alle parameters werken met alle providers. De `llm-context`-modus van Brave
  weigert `ui_lang`; `date_before` vereist ook `date_after`, omdat aangepaste
  versheidsbereiken van Brave zowel een begin- als een einddatum vereisen.
  Gemini, Grok en Kimi retourneren één samengesteld antwoord met bronvermeldingen. Ze
  accepteren `count` voor compatibiliteit met de gedeelde tool, maar dit verandert de
  vorm van het onderbouwde antwoord niet. Gemini behandelt de versheidswaarde `day` als
  een recentheidshint; ruimere versheidswaarden en expliciete datums stellen
  tijdsbereiken in voor onderbouwing met Google Search.
  Perplexity gedraagt zich op dezelfde manier wanneer u het Sonar/OpenRouter-
  compatibiliteitspad gebruikt (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` of `OPENROUTER_API_KEY`); dat pad ondersteunt ook `max_tokens` en
  `max_tokens_per_page` niet.
  SearXNG accepteert `http://` alleen voor vertrouwde hosts in privénetwerken of
  loopbackhosts; openbare SearXNG-eindpunten moeten `https://` gebruiken.
  Firecrawl en Tavily ondersteunen via `web_search` alleen `query` en `count`
  -- gebruik hun specifieke tools voor geavanceerde opties.
</Warning>

## x_search

`x_search` doorzoekt berichten op X (voorheen Twitter) met xAI en retourneert door AI
samengestelde antwoorden met bronvermeldingen. Het accepteert zoekopdrachten in
natuurlijke taal en optionele gestructureerde filters. OpenClaw maakt de ingebouwde
xAI-tool `x_search` per aanvraag aan in plaats van deze permanent geregistreerd te
houden, zodat deze alleen actief is tijdens de beurt waarin deze daadwerkelijk wordt
aangeroepen.

<Warning>
  `x_search` wordt uitgevoerd op de servers van xAI. xAI brengt $ 5 per 1.000
  toolaanroepen in rekening, plus de invoer- en uitvoertokens van het model.
</Warning>

<Note>
  xAI documenteert dat `x_search` zoeken op trefwoorden, semantisch zoeken,
  gebruikers zoeken en threads ophalen ondersteunt. Geef voor interactiestatistieken
  per bericht, zoals reposts, antwoorden, bladwijzers of weergaven, de voorkeur aan een
  gerichte zoekactie voor de exacte bericht-URL of status-ID. Brede zoekopdrachten op
  trefwoorden kunnen het juiste bericht vinden, maar minder volledige metadata per
  bericht retourneren. Een goed patroon is: zoek eerst het bericht en voer daarna een
  tweede `x_search`-zoekopdracht uit die specifiek op dat bericht is gericht.
</Note>

### Configuratie van x_search

Als `enabled` is weggelaten, wordt `x_search` alleen beschikbaar gesteld wanneer de provider van het actieve model `xai` is en de xAI-inloggegevens kunnen worden gevonden. Stel voor een actief model met een bekende niet-xAI-provider `plugins.entries.xai.config.xSearch.enabled` in op `true` om gebruik tussen providers in te schakelen. Als de provider van het actieve model ontbreekt of niet kan worden vastgesteld, blijft de tool verborgen. Stel `enabled` in op `false` om de tool voor elke provider uit te schakelen. xAI-inloggegevens zijn altijd vereist.

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // required for a known non-xAI model provider
            model: "grok-4.3",
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

`x_search` verzendt aanvragen naar `<baseUrl>/responses` wanneer `plugins.entries.xai.config.xSearch.baseUrl` is ingesteld. Als dat veld is weggelaten, valt de tool terug op `plugins.entries.xai.config.webSearch.baseUrl`, vervolgens op de verouderde `tools.web.search.grok.baseUrl` en ten slotte op het openbare xAI-eindpunt (`https://api.x.ai/v1`).

### Parameters van x_search

| Parameter                    | Beschrijving                                                  |
| ---------------------------- | ------------------------------------------------------------- |
| `query`                      | Zoekopdracht (verplicht)                                      |
| `allowed_x_handles`          | Beperk resultaten tot maximaal 20 X-handles                   |
| `excluded_x_handles`         | Sluit maximaal 20 X-handles uit                               |
| `from_date`                  | Neem alleen berichten op deze datum of later op (JJJJ-MM-DD)  |
| `to_date`                    | Neem alleen berichten op deze datum of eerder op (JJJJ-MM-DD) |
| `enable_image_understanding` | Laat xAI afbeeldingen bij overeenkomende berichten analyseren |
| `enable_video_understanding` | Laat xAI video's bij overeenkomende berichten analyseren      |

`allowed_x_handles` en `excluded_x_handles` sluiten elkaar wederzijds uit.

### Voorbeeld van x_search

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

Als u toolprofielen of toelatingslijsten gebruikt, voegt u `web_search`, `x_search` of `group:web` toe:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Gerelateerd

- [Webinhoud ophalen](/nl/tools/web-fetch) -- haal een URL op en extraheer leesbare inhoud
- [Webbrowser](/nl/tools/browser) -- volledige browserautomatisering voor websites die veel JavaScript gebruiken
- [Zoeken met Grok](/nl/tools/grok-search) -- Grok als de `web_search`-provider
- [Webzoeken met Ollama](/nl/tools/ollama-search) -- webzoeken zonder sleutel via uw Ollama-host
