---
read_when:
    - Je wilt zoeken op het web zonder API-sleutel
    - Je wilt de betaalde Search API van Parallel
    - Je wilt compacte fragmenten, gerangschikt voor efficiënte LLM-context
summary: Parallel zoeken -- LLM-geoptimaliseerde informatiedichte fragmenten uit webbronnen
title: Parallel zoeken
x-i18n:
    generated_at: "2026-06-27T18:28:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef64c2c125d2885385308dd8a57421b696fa1a9a5455b8c3b83854016f6514cb
    source_path: tools/parallel-search.md
    workflow: 16
---

De Parallel-Plugin biedt twee [Parallel](https://parallel.ai/) `web_search`-providers:

- **Parallel Search (Free)** (`parallel-free`) -- Parallels gratis
  [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp). Vereist geen
  account of API-sleutel. Selecteer deze expliciet wanneer je Parallels gehoste
  zoekpad zonder sleutel wilt gebruiken.
- **Parallel Search** (`parallel`) -- Parallels betaalde Search API. Vereist een
  `PARALLEL_API_KEY` en biedt hogere snelheidslimieten en afstemming op doelen.

Beide retourneren gerangschikte, voor LLM's geoptimaliseerde fragmenten uit een webindex die is gebouwd voor AI-agents.
Stel `tools.web.search.provider` in op `parallel-free` of `parallel` om er
expliciet een te kiezen.

<Note>
  OpenAI Responses-modellen gebruiken OpenAI's native webzoekfunctie wanneer
  `tools.web.search.provider` niet is ingesteld, dus ze omzeilen de Parallel-providers.
  Stel `tools.web.search.provider` in op `parallel-free` of `parallel` om ze
  via Parallel te routeren.
</Note>

## Plugin installeren

Installeer de officiële Plugin en herstart daarna Gateway:

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## API-sleutel (betaalde provider)

`parallel-free` vereist geen API-sleutel, maar moet nog steeds worden geselecteerd als de
beheerde provider. De betaalde `parallel`-provider heeft een API-sleutel nodig:

<Steps>
  <Step title="Maak een account aan">
    Registreer je op [platform.parallel.ai](https://platform.parallel.ai) en
    genereer een API-sleutel vanuit je dashboard.
  </Step>
  <Step title="Sla de sleutel op">
    Stel `PARALLEL_API_KEY` in de Gateway-omgeving in, of configureer via:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Configuratie

```json5
{
  plugins: {
    entries: {
      parallel: {
        config: {
          webSearch: {
            apiKey: "par-...", // optional if PARALLEL_API_KEY is set
            baseUrl: "https://api.parallel.ai", // optional; OpenClaw appends /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // Use "parallel-free" for the free Search MCP, or "parallel" for
        // the paid API-backed provider shown here.
        provider: "parallel",
      },
    },
  },
}
```

**Omgevingsalternatief:** stel `PARALLEL_API_KEY` in de Gateway-omgeving in.
Voor een gateway-installatie plaats je deze in `~/.openclaw/.env`.

## Overschrijving van basis-URL

De overschrijving van de basis-URL geldt alleen voor de betaalde `parallel`-provider. De gratis
`parallel-free`-provider gebruikt altijd `https://search.parallel.ai/mcp`.

Stel `plugins.entries.parallel.config.webSearch.baseUrl` in wanneer Parallel-aanvragen
via een compatibele proxy of een alternatief Parallel-eindpunt moeten lopen (bijvoorbeeld
de Cloudflare AI Gateway). OpenClaw normaliseert kale hosts door
`https://` ervoor te plaatsen en voegt `/v1/search` toe, tenzij het pad daar al
op eindigt. Het opgeloste eindpunt wordt opgenomen in de zoekcache-sleutel, zodat resultaten
van verschillende Parallel-eindpunten niet worden gedeeld.

## Toolparameters

OpenClaw stelt Parallels native zoekvorm beschikbaar, zodat het model zowel
het doel in natuurlijke taal als enkele korte trefwoordquery's kan invullen — de combinatie
die Parallel [aanbeveelt](https://docs.parallel.ai/search/best-practices) voor
de beste resultaten.

<ParamField path="objective" type="string" required>
Beschrijving in natuurlijke taal van de onderliggende vraag of het doel (max. 5000
tekens). Moet op zichzelf staan.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
Beknopte zoekquery's met trefwoorden, elk 3-6 woorden (1-5 items, max. 200 tekens
elk). Geef 2-3 diverse query's op voor de beste resultaten.
</ParamField>

<ParamField path="count" type="number">
Aantal te retourneren resultaten (1-40).
</ParamField>

<ParamField path="session_id" type="string">
Optionele Parallel-sessie-id (max. 1000 tekens op `parallel`; de gratis
`parallel-free` Search MCP beperkt dit tot 100). Geef de `sessionId` uit een vorig
Parallel-resultaat door bij vervolgzoekopdrachten die deel uitmaken van dezelfde taak, zodat Parallel
gerelateerde aanroepen kan groeperen en latere resultaten kan verbeteren. Een id boven de limiet wordt
genegeerd en er wordt een nieuwe gegenereerd.
</ParamField>

<ParamField path="client_model" type="string">
Optionele identifier van het model dat de aanroep doet (bijv. `claude-opus-4-7`,
`gpt-5.5`). Hiermee kan Parallel standaardinstellingen afstemmen op de
mogelijkheden van je model. Geef de exacte actieve model-slug door; verkort deze niet tot een familiealias.
</ParamField>

## Opmerkingen

- Parallel rangschikt en comprimeert resultaten op basis van bruikbaarheid voor LLM-redeneren, niet
  op doorklikgedrag van mensen; verwacht compacte fragmenten in elk resultaat in plaats van
  volledige pagina-inhoud
- Resultaatfragmenten komen terug als de array `excerpts` en worden ook samengevoegd in
  het veld `description` voor compatibiliteit met het generieke `web_search`-contract
- Parallel retourneert bij elke respons een `session_id`; OpenClaw geeft deze door als
  `sessionId` in de toolpayload, zodat aanroepers vervolgzoekopdrachten kunnen groeperen
- `searchId`, `warnings` en `usage` van Parallel worden doorgegeven wanneer
  aanwezig
- OpenClaw stuurt altijd een opgelost resultaataantal naar Parallel door als
  `advanced_settings.max_results`. Het argument `count` van de aanroeper wint, daarna de
  bovenliggende instelling `tools.web.search.maxResults`, en anders de
  standaardwaarde van OpenClaws generieke `web_search` (5). Dit houdt het resultaatvolume consistent
  bij het wisselen tussen providers; Parallel gebruikt zelfstandig standaard 10
- Resultaten worden standaard 15 minuten gecachet (configureerbaar via
  `cacheTtlMinutes`)
- De gratis `parallel-free`-provider accepteert dezelfde parameters. Deze past
  `count` client-side toe en genereert per aanroep een `session_id` wanneer er geen is
  opgegeven.

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [Exa-zoekfunctie](/nl/tools/exa-search) -- neurale zoekfunctie met contentextractie
- [Perplexity Search](/nl/tools/perplexity-search) -- gestructureerde resultaten met domeinfiltering
