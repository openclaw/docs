---
read_when:
    - Je wilt web_search inschakelen of configureren
    - Je wilt x_search inschakelen of configureren
    - Je moet een zoekprovider kiezen
    - Je wilt automatische detectie en terugval op aanbieders begrijpen
sidebarTitle: Web Search
summary: web_search, x_search en web_fetch -- zoek op het web, zoek X-berichten of haal pagina-inhoud op
title: Zoeken op het web
x-i18n:
    generated_at: "2026-05-07T01:55:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 806b614fe3103439ea0a1acaaaa9f4071e22440cc2091ff814834e75b2079529
    source_path: tools/web.md
    workflow: 16
---

De tool `web_search` doorzoekt het web met je geconfigureerde provider en
retourneert resultaten. Resultaten worden per query 15 minuten gecachet
(configureerbaar).

OpenClaw bevat ook `x_search` voor X-posts (voorheen Twitter) en
`web_fetch` voor lichte URL-fetching. In deze fase blijft `web_fetch`
lokaal, terwijl `web_search` en `x_search` onder de motorkap xAI Responses
kunnen gebruiken.

<Info>
  `web_search` is een lichte HTTP-tool, geen browserautomatisering. Gebruik voor
  sites met veel JS of aanmeldingen de [Webbrowser](/nl/tools/browser). Gebruik
  [Web Fetch](/nl/tools/web-fetch) om een specifieke URL op te halen.
</Info>

## Snelstart

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
    Hiermee worden de provider en eventuele benodigde inloggegevens opgeslagen. Je kunt ook een env
    var instellen (bijvoorbeeld `BRAVE_API_KEY`) en deze stap overslaan voor providers
    met API-ondersteuning.
  </Step>
  <Step title="Gebruik het">
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
    Gestructureerde resultaten met snippets. Ondersteunt `llm-context`-modus en land-/taalfilters. Gratis laag beschikbaar.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/nl/tools/duckduckgo-search">
    Sleutelvrije fallback. Geen API-sleutel nodig. Onofficiële HTML-gebaseerde integratie.
  </Card>
  <Card title="Exa" icon="brain" href="/nl/tools/exa-search">
    Neuraal + zoeken op trefwoorden met contentextractie (markeringen, tekst, samenvattingen).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/nl/tools/firecrawl">
    Gestructureerde resultaten. Werkt het best in combinatie met `firecrawl_search` en `firecrawl_scrape` voor diepe extractie.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/nl/tools/gemini-search">
    AI-gesynthetiseerde antwoorden met citaties via Google Search-grounding.
  </Card>
  <Card title="Grok" icon="zap" href="/nl/tools/grok-search">
    AI-gesynthetiseerde antwoorden met citaties via xAI-webgrounding.
  </Card>
  <Card title="Kimi" icon="moon" href="/nl/tools/kimi-search">
    AI-gesynthetiseerde antwoorden met citaties via Moonshot-webzoekopdrachten; ongegronde chatfallbacks mislukken expliciet.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/nl/tools/minimax-search">
    Gestructureerde resultaten via de zoek-API van het MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/nl/tools/ollama-search">
    Zoeken via een aangemelde lokale Ollama-host of de gehoste Ollama-API.
  </Card>
  <Card title="Perplexity" icon="search" href="/nl/tools/perplexity-search">
    Gestructureerde resultaten met besturing voor contentextractie en domeinfiltering.
  </Card>
  <Card title="SearXNG" icon="server" href="/nl/tools/searxng-search">
    Zelfgehoste meta-search. Geen API-sleutel nodig. Aggregeert Google, Bing, DuckDuckGo en meer.
  </Card>
  <Card title="Tavily" icon="globe" href="/nl/tools/tavily">
    Gestructureerde resultaten met zoekdiepte, onderwerpfiltering en `tavily_extract` voor URL-extractie.
  </Card>
</CardGroup>

### Providervergelijking

| Provider                                  | Resultaatstijl                                                | Filters                                          | API-sleutel                                                                             |
| ----------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/nl/tools/brave-search)              | Gestructureerde snippets                                      | Land, taal, tijd, `llm-context`-modus            | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/nl/tools/duckduckgo-search)    | Gestructureerde snippets                                      | --                                               | Geen (sleutelvrij)                                                                      |
| [Exa](/nl/tools/exa-search)                  | Gestructureerd + geëxtraheerd                                 | Neurale/trefwoordmodus, datum, contentextractie  | `EXA_API_KEY`                                                                           |
| [Firecrawl](/nl/tools/firecrawl)             | Gestructureerde snippets                                      | Via de tool `firecrawl_search`                   | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/nl/tools/gemini-search)            | AI-gesynthetiseerd + citaties                                 | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/nl/tools/grok-search)                | AI-gesynthetiseerd + citaties                                 | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/nl/tools/kimi-search)                | AI-gesynthetiseerd + citaties; mislukt bij ongegronde chatfallbacks | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/nl/tools/minimax-search)   | Gestructureerde snippets                                      | Regio (`global` / `cn`)                          | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/nl/tools/ollama-search) | Gestructureerde snippets                                      | --                                               | Geen voor aangemelde lokale hosts; `OLLAMA_API_KEY` voor directe `https://ollama.com`-zoekopdrachten |
| [Perplexity](/nl/tools/perplexity-search)    | Gestructureerde snippets                                      | Land, taal, tijd, domeinen, contentlimieten      | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/nl/tools/searxng-search)          | Gestructureerde snippets                                      | Categorieën, taal                                | Geen (zelfgehost)                                                                       |
| [Tavily](/nl/tools/tavily)                   | Gestructureerde snippets                                      | Via de tool `tavily_search`                      | `TAVILY_API_KEY`                                                                        |

## Automatische detectie

## Native OpenAI-webzoekfunctie

Directe OpenAI Responses-modellen gebruiken automatisch de gehoste OpenAI-tool `web_search` wanneer OpenClaw-webzoekfunctie is ingeschakeld en er geen beheerde provider is vastgezet. Dit is provider-eigen gedrag in de gebundelde OpenAI-plugin en is alleen van toepassing op native OpenAI API-verkeer, niet op OpenAI-compatibele proxybasis-URL's of Azure-routes. Stel `tools.web.search.provider` in op een andere provider, zoals `brave`, om de beheerde tool `web_search` voor OpenAI-modellen te behouden, of stel `tools.web.search.enabled: false` in om zowel beheerde zoekfunctie als native OpenAI-zoekfunctie uit te schakelen.

## Native Codex-webzoekfunctie

Codex-compatibele modellen kunnen optioneel de provider-native Responses-tool `web_search` gebruiken in plaats van OpenClaws beheerde functie `web_search`.

- Configureer dit onder `tools.web.search.openaiCodex`
- Het wordt alleen geactiveerd voor Codex-compatibele modellen (`openai-codex/*` of providers die `api: "openai-codex-responses"` gebruiken)
- Beheerde `web_search` blijft van toepassing op niet-Codex-modellen
- `mode: "cached"` is de standaardinstelling en aanbevolen instelling
- `tools.web.search.enabled: false` schakelt zowel beheerde als native zoekfunctie uit

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

Als native Codex-zoekfunctie is ingeschakeld maar het huidige model niet Codex-compatibel is, behoudt OpenClaw het normale beheerde `web_search`-gedrag.

## Netwerkveiligheid

Beheerde `web_search`-provideraanroepen gebruiken OpenClaws beveiligde fetch-pad. Voor
vertrouwde provider-API-hosts staat OpenClaw Surge-, Clash- en sing-box-fake-IP
DNS-antwoorden in `198.18.0.0/15` en `fc00::/7` alleen toe voor die providerhostnaam.
Andere private, loopback-, link-local- en metadatabestemmingen blijven geblokkeerd.

Deze automatische toestaan-regel is niet van toepassing op willekeurige `web_fetch`-URL's. Schakel voor
`web_fetch` `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` en
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` expliciet alleen in wanneer je
vertrouwde proxy eigenaar is van die synthetische bereiken.

## Webzoekfunctie instellen

Providerlijsten in docs en configuratiestromen zijn alfabetisch. Automatische detectie hanteert een
aparte prioriteitsvolgorde.

Als er geen `provider` is ingesteld, controleert OpenClaw providers in deze volgorde en gebruikt het de
eerste die gereed is:

Eerst providers met API-ondersteuning:

1. **Brave** -- `BRAVE_API_KEY` of `plugins.entries.brave.config.webSearch.apiKey` (volgorde 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` of `plugins.entries.minimax.config.webSearch.apiKey` (volgorde 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` of `models.providers.google.apiKey` (volgorde 20)
4. **Grok** -- `XAI_API_KEY` of `plugins.entries.xai.config.webSearch.apiKey` (volgorde 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` of `plugins.entries.moonshot.config.webSearch.apiKey` (volgorde 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` of `plugins.entries.perplexity.config.webSearch.apiKey` (volgorde 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` of `plugins.entries.firecrawl.config.webSearch.apiKey` (volgorde 60)
8. **Exa** -- `EXA_API_KEY` of `plugins.entries.exa.config.webSearch.apiKey`; optioneel overschrijft `plugins.entries.exa.config.webSearch.baseUrl` het Exa-eindpunt (volgorde 65)
9. **Tavily** -- `TAVILY_API_KEY` of `plugins.entries.tavily.config.webSearch.apiKey` (volgorde 70)

Daarna sleutelvrije fallbacks:

10. **DuckDuckGo** -- sleutelvrije HTML-fallback zonder account of API-sleutel (volgorde 100)
11. **Ollama Web Search** -- sleutelvrije fallback via je geconfigureerde lokale Ollama-host wanneer die bereikbaar en aangemeld is met `ollama signin`; kan Ollama-providerbearer-auth hergebruiken wanneer de host die nodig heeft, en kan directe `https://ollama.com`-zoekopdrachten uitvoeren wanneer geconfigureerd met `OLLAMA_API_KEY` (volgorde 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` of `plugins.entries.searxng.config.webSearch.baseUrl` (volgorde 200)

Als er geen provider wordt gedetecteerd, valt het terug op Brave (je krijgt dan een fout over een ontbrekende sleutel
die je vraagt er een te configureren).

<Note>
  Alle providersleutelvelden ondersteunen SecretRef-objecten. Plugin-scoped SecretRefs
  onder `plugins.entries.<plugin>.config.webSearch.apiKey` worden opgelost voor de
  gebundelde webzoekproviders met API-ondersteuning, waaronder Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity en Tavily,
  ongeacht of de provider expliciet wordt gekozen via `tools.web.search.provider` of
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

Providerspecifieke configuratie (API-sleutels, basis-URL's, modi) staat onder
`plugins.entries.<plugin>.config.webSearch.*`. Gemini kan ook
`models.providers.google.apiKey` en `models.providers.google.baseUrl` hergebruiken als fallbacks met lagere prioriteit
na de eigen webzoekconfiguratie en `GEMINI_API_KEY`. Zie de
providerpagina's voor voorbeelden.

`tools.web.search.provider` wordt gevalideerd tegen de ids van webzoekproviders
die zijn gedeclareerd door meegeleverde en geïnstalleerde Plugin-manifesten, plus bekende installeerbare
providerplugins. Een typefout zoals `"brvae"` zorgt ervoor dat de configuratievalidatie mislukt in plaats van
stil terug te vallen op automatische detectie. Als de geconfigureerde provider bekend is maar
de bijbehorende Plugin niet beschikbaar is, houdt OpenClaw het opstarten robuust en meldt het een
waarschuwing zodat je `openclaw doctor --fix` kunt uitvoeren om de Plugin te installeren of in te schakelen.
Hetzelfde waarschuwingsgedrag geldt voor verouderd Plugin-bewijs, zoals een achtergebleven
`plugins.entries.<plugin>`-blok na het verwijderen van een externe Plugin.

Selectie van fallbackprovider voor `web_fetch` staat los hiervan:

- kies deze met `tools.web.fetch.provider`
- of laat dat veld weg en laat OpenClaw automatisch de eerste gereedstaande web-fetch-provider
  detecteren op basis van beschikbare referenties
- `web_fetch` zonder sandbox kan geïnstalleerde Plugin-providers gebruiken die
  `contracts.webFetchProviders` declareren; fetches met sandbox blijven uitsluitend meegeleverd
- momenteel is de meegeleverde web-fetch-provider Firecrawl, geconfigureerd onder
  `plugins.entries.firecrawl.config.webFetch.*`

Wanneer je **Kimi** kiest tijdens `openclaw onboard` of
`openclaw configure --section web`, kan OpenClaw ook vragen om:

- de Moonshot API-regio (`https://api.moonshot.ai/v1` of `https://api.moonshot.cn/v1`)
- het standaardmodel voor Kimi-webzoeken (standaard `kimi-k2.6`)

Configureer voor `x_search` `plugins.entries.xai.config.xSearch.*`. Het gebruikt dezelfde
`XAI_API_KEY`-fallback als Grok-webzoekopdrachten.
Verouderde `tools.web.x_search.*`-configuratie wordt automatisch gemigreerd door `openclaw doctor --fix`.
Wanneer je Grok kiest tijdens `openclaw onboard` of `openclaw configure --section web`,
kan OpenClaw ook optionele `x_search`-configuratie aanbieden met dezelfde sleutel.
Dit is een aparte vervolgstap binnen het Grok-pad, niet een aparte providerkeuze op topniveau
voor webzoeken. Als je een andere provider kiest, toont OpenClaw de
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

    Voor een Gateway-installatie plaats je deze in `~/.openclaw/.env`.
    Zie [Env-vars](/nl/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Toolparameters

| Parameter             | Beschrijving                                          |
| --------------------- | ----------------------------------------------------- |
| `query`               | Zoekquery (vereist)                                  |
| `count`               | Te retourneren resultaten (1-10, standaard: 5)        |
| `country`             | 2-letterige ISO-landcode (bijv. "US", "DE")          |
| `language`            | ISO 639-1-taalcode (bijv. "en", "de")                |
| `search_lang`         | Zoektaalcode (alleen Brave)                          |
| `freshness`           | Tijdfilter: `day`, `week`, `month` of `year`          |
| `date_after`          | Resultaten na deze datum (YYYY-MM-DD)                |
| `date_before`         | Resultaten vóór deze datum (YYYY-MM-DD)              |
| `ui_lang`             | UI-taalcode (alleen Brave)                           |
| `domain_filter`       | Domein-allowlist/denylist-array (alleen Perplexity)   |
| `max_tokens`          | Totaal inhoudsbudget, standaard 25000 (alleen Perplexity) |
| `max_tokens_per_page` | Tokenlimiet per pagina, standaard 2048 (alleen Perplexity) |

<Warning>
  Niet alle parameters werken met alle providers. De Brave-modus `llm-context`
  weigert `ui_lang`; `date_before` vereist ook `date_after` omdat aangepaste
  versheidsbereiken in Brave zowel een start- als einddatum vereisen.
  Gemini, Grok en Kimi retourneren één gesynthetiseerd antwoord met citaties. Ze
  accepteren `count` voor compatibiliteit met gedeelde tools, maar dit verandert de
  vorm van het gefundeerde antwoord niet. Gemini ondersteunt `freshness`, `date_after` en
  `date_before` door deze om te zetten naar tijdsbereiken voor Google Search-grounding.
  Perplexity gedraagt zich op dezelfde manier wanneer je het Sonar/OpenRouter-
  compatibiliteitspad gebruikt (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` of `OPENROUTER_API_KEY`).
  SearXNG accepteert `http://` alleen voor vertrouwde privénetwerk- of loopbackhosts;
  openbare SearXNG-eindpunten moeten `https://` gebruiken.
  Firecrawl en Tavily ondersteunen alleen `query` en `count` via `web_search`
  -- gebruik hun eigen tools voor geavanceerde opties.
</Warning>

## x_search

`x_search` doorzoekt X-berichten (voorheen Twitter) met xAI en retourneert
door AI gesynthetiseerde antwoorden met citaties. Het accepteert query's in natuurlijke taal en
optionele gestructureerde filters. OpenClaw schakelt de ingebouwde xAI-`x_search`-
tool alleen in voor de aanvraag die deze toolaanroep bedient.

<Note>
  xAI documenteert `x_search` met ondersteuning voor zoekwoorden zoeken, semantisch zoeken, gebruikers
  zoeken en threads ophalen. Voor betrokkenheidsstatistieken per bericht, zoals reposts,
  reacties, bladwijzers of weergaven, gebruik je bij voorkeur een gerichte lookup voor de exacte post-URL
  of status-ID. Brede zoekwoordzoekopdrachten kunnen het juiste bericht vinden, maar retourneren mogelijk minder
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
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`x_search` post naar `<baseUrl>/responses` wanneer
`plugins.entries.xai.config.xSearch.baseUrl` is ingesteld. Als dat veld is weggelaten,
valt het terug op `plugins.entries.xai.config.webSearch.baseUrl`, vervolgens op de
verouderde `tools.web.search.grok.baseUrl` en ten slotte op het openbare xAI-eindpunt.

### x_search-parameters

| Parameter                    | Beschrijving                                           |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Zoekquery (vereist)                                   |
| `allowed_x_handles`          | Beperk resultaten tot specifieke X-handles             |
| `excluded_x_handles`         | Sluit specifieke X-handles uit                         |
| `from_date`                  | Neem alleen berichten op van of na deze datum (YYYY-MM-DD) |
| `to_date`                    | Neem alleen berichten op van of vóór deze datum (YYYY-MM-DD) |
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
- [Webbrowser](/nl/tools/browser) -- volledige browserautomatisering voor sites met veel JS
- [Grok zoeken](/nl/tools/grok-search) -- Grok als de `web_search`-provider
- [Ollama-webzoekopdracht](/nl/tools/ollama-search) -- webzoekopdrachten zonder sleutel via je Ollama-host
