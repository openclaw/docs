---
read_when:
    - Je wilt web_search inschakelen of configureren
    - Je wilt x_search inschakelen of configureren
    - Je moet een zoekprovider kiezen
    - Je wilt automatische detectie en provider-fallback begrijpen
sidebarTitle: Web Search
summary: web_search, x_search en web_fetch -- zoek op het web, zoek in X-berichten of haal pagina-inhoud op
title: Zoeken op het web
x-i18n:
    generated_at: "2026-05-02T11:31:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: faa333a522a6690e92e8bd00c6096c84b386a97cbfeb508654929a409b39b8ef
    source_path: tools/web.md
    workflow: 16
---

De tool `web_search` doorzoekt het web met je geconfigureerde provider en
retourneert resultaten. Resultaten worden per query 15 minuten gecachet
(configureerbaar).

OpenClaw bevat ook `x_search` voor X-berichten (voorheen Twitter) en
`web_fetch` voor lichtgewicht ophalen van URL's. In deze fase blijft
`web_fetch` lokaal, terwijl `web_search` en `x_search` onder de motorkap xAI
Responses kunnen gebruiken.

<Info>
  `web_search` is een lichtgewicht HTTP-tool, geen browserautomatisering. Gebruik
  voor sites met veel JS of aanmeldingen de [Web Browser](/nl/tools/browser). Gebruik
  voor het ophalen van een specifieke URL [Web Fetch](/nl/tools/web-fetch).
</Info>

## Snel starten

<Steps>
  <Step title="Kies een provider">
    Kies een provider en voltooi eventuele vereiste configuratie. Sommige providers
    vereisen geen sleutel, terwijl andere API-sleutels gebruiken. Zie de
    providerpagina's hieronder voor details.
  </Step>
  <Step title="Configureer">
    ```bash
    openclaw configure --section web
    ```
    Dit slaat de provider en eventuele benodigde referenties op. Je kunt ook een env
    var instellen (bijvoorbeeld `BRAVE_API_KEY`) en deze stap overslaan voor
    providers met API-ondersteuning.
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
    Neuraal + zoeken op trefwoorden met inhoudsextractie (markeringen, tekst, samenvattingen).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/nl/tools/firecrawl">
    Gestructureerde resultaten. Het beste te combineren met `firecrawl_search` en `firecrawl_scrape` voor diepe extractie.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/nl/tools/gemini-search">
    Door AI gesynthetiseerde antwoorden met citaties via Google Search-grounding.
  </Card>
  <Card title="Grok" icon="zap" href="/nl/tools/grok-search">
    Door AI gesynthetiseerde antwoorden met citaties via xAI-webgrounding.
  </Card>
  <Card title="Kimi" icon="moon" href="/nl/tools/kimi-search">
    Door AI gesynthetiseerde antwoorden met citaties via Moonshot-webzoekopdrachten; ongegronde chatfallbacks mislukken expliciet.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/nl/tools/minimax-search">
    Gestructureerde resultaten via de MiniMax Token Plan search API.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/nl/tools/ollama-search">
    Zoeken via een aangemelde lokale Ollama-host of de gehoste Ollama API.
  </Card>
  <Card title="Perplexity" icon="search" href="/nl/tools/perplexity-search">
    Gestructureerde resultaten met bediening voor inhoudsextractie en domeinfiltering.
  </Card>
  <Card title="SearXNG" icon="server" href="/nl/tools/searxng-search">
    Zelfgehoste metazoekmachine. Geen API-sleutel nodig. Aggregeert Google, Bing, DuckDuckGo en meer.
  </Card>
  <Card title="Tavily" icon="globe" href="/nl/tools/tavily">
    Gestructureerde resultaten met zoekdiepte, onderwerpfiltering en `tavily_extract` voor URL-extractie.
  </Card>
</CardGroup>

### Providervergelijking

| Provider                                  | Resultaatstijl                                                | Filters                                          | API-sleutel                                                                            |
| ----------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| [Brave](/nl/tools/brave-search)              | Gestructureerde fragmenten                                    | Land, taal, tijd, modus `llm-context`            | `BRAVE_API_KEY`                                                                        |
| [DuckDuckGo](/nl/tools/duckduckgo-search)    | Gestructureerde fragmenten                                    | --                                               | Geen (sleutelvrij)                                                                     |
| [Exa](/nl/tools/exa-search)                  | Gestructureerd + geëxtraheerd                                 | Neurale/trefwoordmodus, datum, inhoudsextractie  | `EXA_API_KEY`                                                                          |
| [Firecrawl](/nl/tools/firecrawl)             | Gestructureerde fragmenten                                    | Via tool `firecrawl_search`                      | `FIRECRAWL_API_KEY`                                                                    |
| [Gemini](/nl/tools/gemini-search)            | Door AI gesynthetiseerd + citaties                            | --                                               | `GEMINI_API_KEY`                                                                       |
| [Grok](/nl/tools/grok-search)                | Door AI gesynthetiseerd + citaties                            | --                                               | `XAI_API_KEY`                                                                          |
| [Kimi](/nl/tools/kimi-search)                | Door AI gesynthetiseerd + citaties; mislukt bij ongegronde chatfallbacks | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                    |
| [MiniMax Search](/nl/tools/minimax-search)   | Gestructureerde fragmenten                                    | Regio (`global` / `cn`)                          | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`             |
| [Ollama Web Search](/nl/tools/ollama-search) | Gestructureerde fragmenten                                    | --                                               | Geen voor aangemelde lokale hosts; `OLLAMA_API_KEY` voor directe `https://ollama.com`-zoekopdrachten |
| [Perplexity](/nl/tools/perplexity-search)    | Gestructureerde fragmenten                                    | Land, taal, tijd, domeinen, inhoudslimieten      | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                            |
| [SearXNG](/nl/tools/searxng-search)          | Gestructureerde fragmenten                                    | Categorieën, taal                                | Geen (zelfgehost)                                                                      |
| [Tavily](/nl/tools/tavily)                   | Gestructureerde fragmenten                                    | Via tool `tavily_search`                         | `TAVILY_API_KEY`                                                                       |

## Automatische detectie

## Native OpenAI-webzoekopdracht

Directe OpenAI Responses-modellen gebruiken automatisch de gehoste tool `web_search` van OpenAI wanneer OpenClaw-webzoekopdracht is ingeschakeld en er geen beheerde provider is vastgezet. Dit is gedrag dat eigendom is van de provider in de meegeleverde OpenAI-Plugin en geldt alleen voor native OpenAI API-verkeer, niet voor OpenAI-compatibele proxybasis-URL's of Azure-routes. Stel `tools.web.search.provider` in op een andere provider zoals `brave` om de beheerde tool `web_search` voor OpenAI-modellen te behouden, of stel `tools.web.search.enabled: false` in om zowel beheerde zoekopdracht als native OpenAI-zoekopdracht uit te schakelen.

## Native Codex-webzoekopdracht

Codex-geschikte modellen kunnen optioneel de provider-native Responses-tool `web_search` gebruiken in plaats van de beheerde functie `web_search` van OpenClaw.

- Configureer dit onder `tools.web.search.openaiCodex`
- Dit wordt alleen geactiveerd voor Codex-geschikte modellen (`openai-codex/*` of providers die `api: "openai-codex-responses"` gebruiken)
- Beheerde `web_search` blijft gelden voor niet-Codex-modellen
- `mode: "cached"` is de standaardinstelling en aanbevolen instelling
- `tools.web.search.enabled: false` schakelt zowel beheerde als native zoekopdracht uit

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

Als native Codex-zoekopdracht is ingeschakeld maar het huidige model niet Codex-geschikt is, behoudt OpenClaw het normale beheerde `web_search`-gedrag.

## Webzoekopdracht instellen

Providerlijsten in docs en configuratiestromen zijn alfabetisch. Automatische
detectie behoudt een aparte voorrangsvolgorde.

Als er geen `provider` is ingesteld, controleert OpenClaw providers in deze volgorde en gebruikt het
de eerste die gereed is:

Eerst providers met API-ondersteuning:

1. **Brave** -- `BRAVE_API_KEY` of `plugins.entries.brave.config.webSearch.apiKey` (volgorde 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` of `plugins.entries.minimax.config.webSearch.apiKey` (volgorde 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` of `models.providers.google.apiKey` (volgorde 20)
4. **Grok** -- `XAI_API_KEY` of `plugins.entries.xai.config.webSearch.apiKey` (volgorde 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` of `plugins.entries.moonshot.config.webSearch.apiKey` (volgorde 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` of `plugins.entries.perplexity.config.webSearch.apiKey` (volgorde 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` of `plugins.entries.firecrawl.config.webSearch.apiKey` (volgorde 60)
8. **Exa** -- `EXA_API_KEY` of `plugins.entries.exa.config.webSearch.apiKey`; optionele `plugins.entries.exa.config.webSearch.baseUrl` overschrijft het Exa-eindpunt (volgorde 65)
9. **Tavily** -- `TAVILY_API_KEY` of `plugins.entries.tavily.config.webSearch.apiKey` (volgorde 70)

Daarna sleutelvrije fallbacks:

10. **DuckDuckGo** -- sleutelvrije HTML-fallback zonder account of API-sleutel (volgorde 100)
11. **Ollama Web Search** -- sleutelvrije fallback via je geconfigureerde lokale Ollama-host wanneer die bereikbaar en aangemeld is met `ollama signin`; kan bearer-auth van de Ollama-provider hergebruiken wanneer de host die nodig heeft, en kan directe `https://ollama.com`-zoekopdrachten aanroepen wanneer geconfigureerd met `OLLAMA_API_KEY` (volgorde 110)
12. **SearXNG** -- `SEARXNG_BASE_URL` of `plugins.entries.searxng.config.webSearch.baseUrl` (volgorde 200)

Als er geen provider wordt gedetecteerd, valt het terug op Brave (je krijgt een fout over een ontbrekende sleutel
die je vraagt er een te configureren).

<Note>
  Alle sleutelvelden van providers ondersteunen SecretRef-objecten. Plugin-gebonden SecretRefs
  onder `plugins.entries.<plugin>.config.webSearch.apiKey` worden opgelost voor de
  meegeleverde webzoekproviders met API-ondersteuning, waaronder Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Perplexity en Tavily,
  ongeacht of de provider expliciet wordt gekozen via `tools.web.search.provider` of
  via automatische detectie wordt geselecteerd. In de modus voor automatische detectie lost OpenClaw alleen de
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

Providerspecifieke configuratie (API-sleutels, basis-URL's, modi) staat onder
`plugins.entries.<plugin>.config.webSearch.*`. Gemini kan ook
`models.providers.google.apiKey` en `models.providers.google.baseUrl` hergebruiken als fallbacks met lagere prioriteit
na de speciale webzoekconfiguratie en `GEMINI_API_KEY`. Zie de
providerpagina's voor voorbeelden.

`tools.web.search.provider` wordt gevalideerd op basis van de web-search-provider-id's
die zijn gedeclareerd door gebundelde en geinstalleerde Plugin-manifesten. Een typefout zoals `"brvae"`
laat configuratievalidatie mislukken in plaats van stilzwijgend terug te vallen op automatische detectie. Als een
geconfigureerde provider alleen verouderd Plugin-bewijs heeft, zoals een achtergebleven
`plugins.entries.<plugin>`-blok na het verwijderen van een Plugin van derden,
houdt OpenClaw het opstarten robuust en meldt het een waarschuwing zodat je de
Plugin opnieuw kunt installeren of `openclaw doctor --fix` kunt uitvoeren om de verouderde configuratie op te schonen.

Providerselectie voor de fallback van `web_fetch` staat los hiervan:

- kies deze met `tools.web.fetch.provider`
- of laat dat veld weg en laat OpenClaw automatisch de eerste gereedstaande web-fetch-
  provider detecteren op basis van beschikbare referenties
- niet-gesandboxte `web_fetch` kan geinstalleerde Plugin-providers gebruiken die
  `contracts.webFetchProviders` declareren; gesandboxte fetches blijven alleen gebundeld
- vandaag is de gebundelde web-fetch-provider Firecrawl, geconfigureerd onder
  `plugins.entries.firecrawl.config.webFetch.*`

Wanneer je **Kimi** kiest tijdens `openclaw onboard` of
`openclaw configure --section web`, kan OpenClaw ook vragen om:

- de Moonshot API-regio (`https://api.moonshot.ai/v1` of `https://api.moonshot.cn/v1`)
- het standaard Kimi web-search-model (standaard `kimi-k2.6`)

Configureer voor `x_search` `plugins.entries.xai.config.xSearch.*`. Het gebruikt dezelfde
`XAI_API_KEY`-fallback als Grok web search.
Verouderde `tools.web.x_search.*`-configuratie wordt automatisch gemigreerd door `openclaw doctor --fix`.
Wanneer je Grok kiest tijdens `openclaw onboard` of `openclaw configure --section web`,
kan OpenClaw ook optionele `x_search`-instelling aanbieden met dezelfde sleutel.
Dit is een aparte vervolgstap binnen het Grok-pad, geen aparte keuze voor een
web-search-provider op het hoogste niveau. Als je een andere provider kiest, toont OpenClaw de
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

    Plaats deze voor een Gateway-installatie in `~/.openclaw/.env`.
    Zie [Env-vars](/nl/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Toolparameters

| Parameter             | Beschrijving                                           |
| --------------------- | ----------------------------------------------------- |
| `query`               | Zoekquery (verplicht)                                  |
| `count`               | Te retourneren resultaten (1-10, standaard: 5)         |
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
  Niet alle parameters werken met alle providers. De Brave `llm-context`-modus
  weigert `ui_lang`; `date_before` heeft ook `date_after` nodig omdat aangepaste
  freshness-bereiken van Brave zowel een begin- als einddatum vereisen.
  Gemini, Grok en Kimi retourneren een gesynthetiseerd antwoord met citaties. Ze
  accepteren `count` voor compatibiliteit met gedeelde tools, maar dit verandert de
  vorm van het gegronde antwoord niet. Gemini ondersteunt `freshness`, `date_after` en
  `date_before` door ze om te zetten naar tijdbereiken voor Google Search-grounding.
  Perplexity gedraagt zich op dezelfde manier wanneer je het Sonar/OpenRouter-
  compatibiliteitspad gebruikt (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` of `OPENROUTER_API_KEY`).
  SearXNG accepteert `http://` alleen voor vertrouwde private-network- of loopback-hosts;
  publieke SearXNG-eindpunten moeten `https://` gebruiken.
  Firecrawl en Tavily ondersteunen via `web_search` alleen `query` en `count`
  -- gebruik hun specifieke tools voor geavanceerde opties.
</Warning>

## x_search

`x_search` doorzoekt X-berichten (voorheen Twitter) met xAI en retourneert
door AI gesynthetiseerde antwoorden met citaties. Het accepteert query's in natuurlijke taal en
optionele gestructureerde filters. OpenClaw schakelt de ingebouwde xAI `x_search`-
tool alleen in voor de aanvraag die deze toolaanroep afhandelt.

<Note>
  xAI documenteert dat `x_search` keyword search, semantic search, user
  search en thread fetch ondersteunt. Voor engagementstatistieken per bericht, zoals reposts,
  replies, bookmarks of views, heeft een gerichte lookup voor de exacte bericht-URL
  of status-ID de voorkeur. Brede keyword searches kunnen het juiste bericht vinden maar minder
  volledige metadata per bericht retourneren. Een goed patroon is: lokaliseer eerst het bericht en
  voer daarna een tweede `x_search`-query uit die op dat exacte bericht is gericht.
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
`plugins.entries.xai.config.xSearch.baseUrl` is ingesteld. Als dat veld wordt weggelaten,
valt het terug op `plugins.entries.xai.config.webSearch.baseUrl`, daarna op de
verouderde `tools.web.search.grok.baseUrl` en uiteindelijk op het publieke xAI-eindpunt.

### x_search-parameters

| Parameter                    | Beschrijving                                            |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Zoekquery (verplicht)                                  |
| `allowed_x_handles`          | Beperk resultaten tot specifieke X-handles             |
| `excluded_x_handles`         | Sluit specifieke X-handles uit                         |
| `from_date`                  | Neem alleen berichten op of na deze datum op (YYYY-MM-DD) |
| `to_date`                    | Neem alleen berichten op of voor deze datum op (YYYY-MM-DD) |
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
- [Webbrowser](/nl/tools/browser) -- volledige browserautomatisering voor JS-zware sites
- [Grok Search](/nl/tools/grok-search) -- Grok als de `web_search`-provider
- [Ollama Web Search](/nl/tools/ollama-search) -- web search zonder sleutel via je Ollama-host
