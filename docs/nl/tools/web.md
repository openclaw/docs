---
read_when:
    - U wilt web_search inschakelen of configureren
    - Je wilt x_search inschakelen of configureren
    - U moet een zoekprovider kiezen
    - Je wilt automatische detectie en providerfallback begrijpen
sidebarTitle: Web Search
summary: web_search, x_search en web_fetch -- doorzoek het web, doorzoek X-berichten of haal pagina-inhoud op
title: Zoeken op het web
x-i18n:
    generated_at: "2026-05-11T20:56:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c2806730f8c9cb33a3c142d5283de0f1231502e052c6da796c31125834a94e6
    source_path: tools/web.md
    workflow: 16
---

Het hulpmiddel `web_search` doorzoekt het web met je geconfigureerde provider en
retourneert resultaten. Resultaten worden per query 15 minuten gecachet
(configureerbaar).

OpenClaw bevat ook `x_search` voor X-berichten (voorheen Twitter) en
`web_fetch` voor lichtgewicht URL-ophalen. In deze fase blijft `web_fetch`
lokaal, terwijl `web_search` en `x_search` onder water xAI Responses kunnen
gebruiken.

<Info>
  `web_search` is een lichtgewicht HTTP-hulpmiddel, geen browserautomatisering. Gebruik voor
  JS-zware sites of aanmeldingen de [Webbrowser](/nl/tools/browser). Gebruik voor
  het ophalen van een specifieke URL [Web Fetch](/nl/tools/web-fetch).
</Info>

## Snel aan de slag

<Steps>
  <Step title="Kies een provider">
    Kies een provider en voltooi eventuele vereiste configuratie. Sommige providers zijn
    sleutelvrij, terwijl andere API-sleutels gebruiken. Zie de providerpagina's hieronder voor
    details.
  </Step>
  <Step title="Configureer">
    ```bash
    openclaw configure --section web
    ```
    Hiermee worden de provider en eventuele benodigde referentie opgeslagen. Je kunt ook een env
    var instellen (bijvoorbeeld `BRAVE_API_KEY`) en deze stap overslaan voor door API ondersteunde
    providers.
  </Step>
  <Step title="Gebruik het">
    De agent kan nu `web_search` aanroepen:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Gebruik voor X-berichten:

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
  <Card title="DuckDuckGo" icon="bird" href="/nl/tools/duckduckgo-search">
    Sleutelvrije fallback. Geen API-sleutel nodig. Onofficiële HTML-gebaseerde integratie.
  </Card>
  <Card title="Exa" icon="brain" href="/nl/tools/exa-search">
    Neuraal + trefwoordzoeken met contentextractie (highlights, tekst, samenvattingen).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/nl/tools/firecrawl">
    Gestructureerde resultaten. Het best gecombineerd met `firecrawl_search` en `firecrawl_scrape` voor diepe extractie.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/nl/tools/gemini-search">
    AI-gesynthetiseerde antwoorden met citaties via Google Search-grounding.
  </Card>
  <Card title="Grok" icon="zap" href="/nl/tools/grok-search">
    AI-gesynthetiseerde antwoorden met citaties via xAI web-grounding.
  </Card>
  <Card title="Kimi" icon="moon" href="/nl/tools/kimi-search">
    AI-gesynthetiseerde antwoorden met citaties via Moonshot-webzoekopdrachten; ongegrounde chat-fallbacks mislukken expliciet.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/nl/tools/minimax-search">
    Gestructureerde resultaten via de MiniMax Token Plan-zoek-API.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/nl/tools/ollama-search">
    Zoeken via een aangemelde lokale Ollama-host of de gehoste Ollama API.
  </Card>
  <Card title="Perplexity" icon="search" href="/nl/tools/perplexity-search">
    Gestructureerde resultaten met bediening voor contentextractie en domeinfiltering.
  </Card>
  <Card title="SearXNG" icon="server" href="/nl/tools/searxng-search">
    Zelfgehoste metazoekmachine. Geen API-sleutel nodig. Aggregeert Google, Bing, DuckDuckGo en meer.
  </Card>
  <Card title="Tavily" icon="globe" href="/nl/tools/tavily">
    Gestructureerde resultaten met zoekdiepte, onderwerpfiltering en `tavily_extract` voor URL-extractie.
  </Card>
</CardGroup>

### Providervergelijking

| Provider                                  | Resultaatstijl                                                | Filters                                          | API-sleutel                                                                             |
| ----------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/nl/tools/brave-search)              | Gestructureerde fragmenten                                    | Land, taal, tijd, modus `llm-context`            | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/nl/tools/duckduckgo-search)    | Gestructureerde fragmenten                                    | --                                               | Geen (sleutelvrij)                                                                      |
| [Exa](/nl/tools/exa-search)                  | Gestructureerd + geëxtraheerd                                 | Neurale/trefwoordmodus, datum, contentextractie  | `EXA_API_KEY`                                                                           |
| [Firecrawl](/nl/tools/firecrawl)             | Gestructureerde fragmenten                                    | Via het hulpmiddel `firecrawl_search`            | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/nl/tools/gemini-search)            | AI-gesynthetiseerd + citaties                                 | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/nl/tools/grok-search)                | AI-gesynthetiseerd + citaties                                 | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/nl/tools/kimi-search)                | AI-gesynthetiseerd + citaties; mislukt bij ongegrounde chat-fallbacks | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/nl/tools/minimax-search)   | Gestructureerde fragmenten                                    | Regio (`global` / `cn`)                          | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/nl/tools/ollama-search) | Gestructureerde fragmenten                                    | --                                               | Geen voor aangemelde lokale hosts; `OLLAMA_API_KEY` voor direct zoeken via `https://ollama.com` |
| [Perplexity](/nl/tools/perplexity-search)    | Gestructureerde fragmenten                                    | Land, taal, tijd, domeinen, contentlimieten      | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/nl/tools/searxng-search)          | Gestructureerde fragmenten                                    | Categorieën, taal                                | Geen (zelfgehost)                                                                       |
| [Tavily](/nl/tools/tavily)                   | Gestructureerde fragmenten                                    | Via het hulpmiddel `tavily_search`               | `TAVILY_API_KEY`                                                                        |

## Automatische detectie

## Native OpenAI-webzoekopdracht

Directe OpenAI Responses-modellen gebruiken automatisch het gehoste hulpmiddel `web_search` van OpenAI wanneer OpenClaw-webzoekopdrachten zijn ingeschakeld en er geen beheerde provider is vastgezet. Dit is provider-eigen gedrag in de gebundelde OpenAI-Plugin en geldt alleen voor native OpenAI API-verkeer, niet voor OpenAI-compatibele proxybasis-URL's of Azure-routes. Stel `tools.web.search.provider` in op een andere provider, zoals `brave`, om het beheerde hulpmiddel `web_search` voor OpenAI-modellen te behouden, of stel `tools.web.search.enabled: false` in om zowel beheerd zoeken als native OpenAI-zoeken uit te schakelen.

## Native Codex-webzoekopdracht

Codex-geschikte modellen kunnen optioneel het provider-native Responses-hulpmiddel `web_search` gebruiken in plaats van de beheerde functie `web_search` van OpenClaw.

- Configureer dit onder `tools.web.search.openaiCodex`
- Het wordt alleen geactiveerd voor Codex-geschikte modellen (`openai-codex/*` of providers die `api: "openai-codex-responses"` gebruiken)
- Beheerde `web_search` blijft gelden voor niet-Codex-modellen
- `mode: "cached"` is de standaard en aanbevolen instelling
- `tools.web.search.enabled: false` schakelt zowel beheerd als native zoeken uit

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

Als native Codex-zoeken is ingeschakeld maar het huidige model niet Codex-geschikt is, behoudt OpenClaw het normale beheerde `web_search`-gedrag.

## Netwerkveiligheid

Beheerde `web_search`-provideroproepen gebruiken het beveiligde fetch-pad van OpenClaw. Voor
vertrouwde provider-API-hosts staat OpenClaw Surge-, Clash- en sing-box-fake-IP
DNS-antwoorden in `198.18.0.0/15` en `fc00::/7` alleen toe voor die providerhostnaam.
Andere private, loopback-, link-local- en metadatabestemmingen blijven geblokkeerd.

Deze automatische toelating geldt niet voor willekeurige `web_fetch`-URL's. Schakel voor
`web_fetch` `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` en
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` alleen expliciet in wanneer je
vertrouwde proxy eigenaar is van die synthetische bereiken.

## Webzoekopdrachten instellen

Providerlijsten in docs en setupflows zijn alfabetisch. Automatische detectie houdt een
aparte prioriteitsvolgorde aan.

Als er geen `provider` is ingesteld, controleert OpenClaw providers in deze volgorde en gebruikt het
de eerste die klaar is:

Eerst door API ondersteunde providers:

1. **Brave** -- `BRAVE_API_KEY` of `plugins.entries.brave.config.webSearch.apiKey` (volgorde 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` of `plugins.entries.minimax.config.webSearch.apiKey` (volgorde 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY`, of `models.providers.google.apiKey` (volgorde 20)
4. **Grok** -- `XAI_API_KEY` of `plugins.entries.xai.config.webSearch.apiKey` (volgorde 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` of `plugins.entries.moonshot.config.webSearch.apiKey` (volgorde 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` of `plugins.entries.perplexity.config.webSearch.apiKey` (volgorde 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` of `plugins.entries.firecrawl.config.webSearch.apiKey` (volgorde 60)
8. **Exa** -- `EXA_API_KEY` of `plugins.entries.exa.config.webSearch.apiKey`; optioneel overschrijft `plugins.entries.exa.config.webSearch.baseUrl` het Exa-eindpunt (volgorde 65)
9. **Tavily** -- `TAVILY_API_KEY` of `plugins.entries.tavily.config.webSearch.apiKey` (volgorde 70)

Daarna sleutelvrije fallbacks:

10. **DuckDuckGo** -- sleutelvrije HTML-fallback zonder account of API-sleutel (volgorde 100)
11. **Ollama Web Search** -- sleutelvrije fallback via je geconfigureerde lokale Ollama-host wanneer die bereikbaar en aangemeld is met `ollama signin`; kan Ollama-providerbearer-auth hergebruiken wanneer de host dit nodig heeft, en kan directe `https://ollama.com`-zoekopdrachten aanroepen wanneer geconfigureerd met `OLLAMA_API_KEY` (volgorde 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` of `plugins.entries.searxng.config.webSearch.baseUrl` (volgorde 200)

Als er geen provider wordt gedetecteerd, valt het terug op Brave (je krijgt een fout over een ontbrekende sleutel
die je vraagt er een te configureren).

<Note>
  Alle providersleutelvelden ondersteunen SecretRef-objecten. Plugin-scoped SecretRefs
  onder `plugins.entries.<plugin>.config.webSearch.apiKey` worden opgelost voor de
  gebundelde door API ondersteunde webzoekproviders, waaronder Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity en Tavily,
  ongeacht of de provider expliciet via `tools.web.search.provider` wordt gekozen of
  via automatische detectie wordt geselecteerd. In automatische-detectiemodus lost OpenClaw alleen de
  geselecteerde providersleutel op -- niet-geselecteerde SecretRefs blijven inactief, zodat je
  meerdere providers geconfigureerd kunt houden zonder resolutiekosten te betalen voor de
  providers die je niet gebruikt.
</Note>

## Config

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
`models.providers.google.apiKey` en `models.providers.google.baseUrl` hergebruiken als fallbacks met lagere prioriteit
na de eigen webzoekconfiguratie en `GEMINI_API_KEY`. Zie de
providerpagina's voor voorbeelden.

`tools.web.search.provider` wordt gevalideerd tegen de webzoekprovider-id's
die zijn gedeclareerd door gebundelde en geïnstalleerde Plugin-manifesten. Een typfout zoals `"brvae"`
laat de configuratievalidatie mislukken in plaats van stilzwijgend terug te vallen op automatische detectie. Als een
geconfigureerde provider alleen verouderd Plugin-bewijs heeft, zoals een achtergebleven
`plugins.entries.<plugin>`-blok na het verwijderen van een externe Plugin,
houdt OpenClaw het opstarten veerkrachtig en rapporteert het een waarschuwing zodat je de
Plugin opnieuw kunt installeren of `openclaw doctor --fix` kunt uitvoeren om de verouderde configuratie op te schonen.

De selectie van de fallbackprovider voor `web_fetch` staat hier los van:

- kies deze met `tools.web.fetch.provider`
- of laat dat veld weg en laat OpenClaw automatisch de eerste gereedstaande webfetchprovider
  detecteren op basis van beschikbare referenties
- niet-gesandboxte `web_fetch` kan geïnstalleerde Plugin-providers gebruiken die
  `contracts.webFetchProviders` declareren; gesandboxte fetches blijven alleen gebundeld
- vandaag is de gebundelde webfetchprovider Firecrawl, geconfigureerd onder
  `plugins.entries.firecrawl.config.webFetch.*`

Wanneer je **Kimi** kiest tijdens `openclaw onboard` of
`openclaw configure --section web`, kan OpenClaw ook vragen om:

- de Moonshot API-regio (`https://api.moonshot.ai/v1` of `https://api.moonshot.cn/v1`)
- het standaard Kimi-webzoekmodel (standaard `kimi-k2.6`)

Configureer voor `x_search` `plugins.entries.xai.config.xSearch.*`. Het gebruikt hetzelfde
xAI-authprofiel als chat, of de `XAI_API_KEY` / Plugin-webzoekreferentie
die door Grok-webzoekopdrachten wordt gebruikt.
Verouderde `tools.web.x_search.*`-configuratie wordt automatisch gemigreerd door `openclaw doctor --fix`.
Wanneer je Grok kiest tijdens `openclaw onboard` of `openclaw configure --section web`,
kan OpenClaw ook optionele `x_search`-instelling aanbieden met dezelfde sleutel.
Dit is een aparte vervolgstap binnen het Grok-pad, geen aparte keuze voor een webzoekprovider
op het hoogste niveau. Als je een andere provider kiest, toont OpenClaw de
`x_search`-prompt niet.

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
    Stel de provider-env-var in de procesomgeving van de Gateway in:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Plaats deze voor een gateway-installatie in `~/.openclaw/.env`.
    Zie [Env vars](/nl/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Toolparameters

| Parameter             | Beschrijving                                           |
| --------------------- | ------------------------------------------------------ |
| `query`               | Zoekquery (vereist)                                    |
| `count`               | Terug te geven resultaten (1-10, standaard: 5)         |
| `country`             | ISO-landcode van 2 letters (bijv. "US", "DE")          |
| `language`            | ISO 639-1-taalcode (bijv. "en", "de")                 |
| `search_lang`         | Zoektaalcode (alleen Brave)                            |
| `freshness`           | Tijdfilter: `day`, `week`, `month` of `year`           |
| `date_after`          | Resultaten na deze datum (YYYY-MM-DD)                  |
| `date_before`         | Resultaten voor deze datum (YYYY-MM-DD)                |
| `ui_lang`             | UI-taalcode (alleen Brave)                             |
| `domain_filter`       | Domein-allowlist/denylist-array (alleen Perplexity)    |
| `max_tokens`          | Totaal inhoudsbudget, standaard 25000 (alleen Perplexity) |
| `max_tokens_per_page` | Tokenlimiet per pagina, standaard 2048 (alleen Perplexity) |

<Warning>
  Niet alle parameters werken met alle providers. Brave `llm-context`-modus
  weigert `ui_lang`; `date_before` vereist ook `date_after` omdat aangepaste
  versheidsbereiken van Brave zowel een begin- als einddatum vereisen.
  Gemini, Grok en Kimi geven één gesynthetiseerd antwoord met citaties terug. Ze
  accepteren `count` voor compatibiliteit met gedeelde tools, maar dit verandert de
  vorm van het onderbouwde antwoord niet. Gemini ondersteunt `freshness`, `date_after` en
  `date_before` door deze om te zetten naar tijdbereiken voor Google Search-grounding.
  Perplexity gedraagt zich op dezelfde manier wanneer je het Sonar/OpenRouter-
  compatibiliteitspad gebruikt (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` of `OPENROUTER_API_KEY`).
  SearXNG accepteert `http://` alleen voor vertrouwde privénetwerk- of loopback-hosts;
  publieke SearXNG-eindpunten moeten `https://` gebruiken.
  Firecrawl en Tavily ondersteunen via `web_search` alleen `query` en `count`
  -- gebruik hun speciale tools voor geavanceerde opties.
</Warning>

## x_search

`x_search` doorzoekt X-berichten (voorheen Twitter) met xAI en retourneert
door AI gesynthetiseerde antwoorden met citaties. Het accepteert zoekopdrachten in natuurlijke taal en
optionele gestructureerde filters. OpenClaw schakelt de ingebouwde xAI-`x_search`-
tool alleen in voor het verzoek dat deze toolaanroep bedient.

<Note>
  xAI documenteert dat `x_search` zoeken op trefwoorden, semantisch zoeken, gebruikerszoeken
  en het ophalen van threads ondersteunt. Voor betrokkenheidsstatistieken per bericht, zoals reposts,
  reacties, bladwijzers of weergaven, kun je beter een gerichte zoekopdracht gebruiken voor de exacte bericht-URL
  of status-ID. Brede zoekopdrachten op trefwoorden kunnen het juiste bericht vinden, maar leveren mogelijk minder
  volledige metadata per bericht op. Een goed patroon is: zoek eerst het bericht, voer daarna
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
verouderde `tools.web.search.grok.baseUrl` en uiteindelijk op het publieke xAI-eindpunt.

### x_search-parameters

| Parameter                    | Beschrijving                                           |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Zoekquery (vereist)                                    |
| `allowed_x_handles`          | Beperk resultaten tot specifieke X-handles             |
| `excluded_x_handles`         | Sluit specifieke X-handles uit                         |
| `from_date`                  | Neem alleen berichten op vanaf of na deze datum (YYYY-MM-DD) |
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

Als je toolprofielen of allowlists gebruikt, voeg dan `web_search`, `x_search` of `group:web` toe:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Gerelateerd

- [Web Fetch](/nl/tools/web-fetch) -- haal een URL op en extraheer leesbare inhoud
- [Web Browser](/nl/tools/browser) -- volledige browserautomatisering voor JS-zware sites
- [Grok Search](/nl/tools/grok-search) -- Grok als de `web_search`-provider
- [Ollama Web Search](/nl/tools/ollama-search) -- webzoekopdrachten zonder sleutel via je Ollama-host
