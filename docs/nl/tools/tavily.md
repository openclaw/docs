---
read_when:
    - Je wilt webzoeken ondersteund door Tavily
    - Je hebt een Tavily API-sleutel nodig
    - Je wilt Tavily als web_search-provider
    - Je wilt inhoudsextractie uit URL's
summary: Tavily zoek- en extractietools
title: Tavily
x-i18n:
    generated_at: "2026-06-27T18:30:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539e76120e858129dabfb85c1fe379837fc87be491d5a57803917bf6bb7018ae
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) is een zoek-API die is ontworpen voor AI-toepassingen. OpenClaw biedt deze op twee manieren aan:

- als de `web_search`-provider voor de generieke zoektool
- als expliciete Plugin-tools: `tavily_search` en `tavily_extract`

Tavily retourneert gestructureerde resultaten die zijn geoptimaliseerd voor gebruik door LLM's, met configureerbare zoekdiepte, onderwerpfiltering, domeinfilters, door AI gegenereerde antwoordsamenvattingen en contentextractie uit URL's (inclusief door JavaScript gerenderde pagina's).

| Eigenschap | Waarde                              |
| ---------- | ----------------------------------- |
| Plugin-id  | `tavily`                            |
| Pakket     | `@openclaw/tavily-plugin`           |
| Auth       | `TAVILY_API_KEY` of config `apiKey` |
| Basis-URL  | `https://api.tavily.com` (standaard) |
| Tools      | `tavily_search`, `tavily_extract`   |

## Aan de slag

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="Get an API key">
    Maak een Tavily-account aan op [tavily.com](https://tavily.com) en genereer daarna een API-sleutel in het dashboard.
  </Step>
  <Step title="Configure the plugin and provider">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
                baseUrl: "https://api.tavily.com",
              },
            },
          },
        },
      },
      tools: {
        web: {
          search: {
            provider: "tavily",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Verify search runs">
    Start een `web_search` vanuit een agent, of roep `tavily_search` rechtstreeks aan.
  </Step>
</Steps>

<Tip>
Als je Tavily kiest tijdens onboarding of via `openclaw configure --section web`, wordt de officiële Tavily-Plugin geïnstalleerd en ingeschakeld wanneer dat nodig is.
</Tip>

## Toolreferentie

### `tavily_search`

Gebruik dit wanneer je Tavily-specifieke zoekinstellingen wilt in plaats van de generieke `web_search`.

| Parameter         | Type         | Beperkingen / standaardwaarde         | Beschrijving                                      |
| ----------------- | ------------ | ------------------------------------- | ------------------------------------------------- |
| `query`           | string       | vereist                               | Zoekquerystring. Houd deze onder 400 tekens.      |
| `search_depth`    | enum         | `basic` (standaard), `advanced`       | `advanced` is langzamer maar relevanter.          |
| `topic`           | enum         | `general` (standaard), `news`, `finance` | Filter op onderwerpfamilie.                    |
| `max_results`     | integer      | 1-20                                  | Aantal resultaten.                                |
| `include_answer`  | boolean      | standaard `false`                     | Voeg een door Tavily AI gegenereerde antwoordsamenvatting toe. |
| `time_range`      | enum         | `day`, `week`, `month`, `year`        | Filter resultaten op recentheid.                  |
| `include_domains` | string array | (geen)                                | Neem alleen resultaten van deze domeinen op.      |
| `exclude_domains` | string array | (geen)                                | Sluit resultaten van deze domeinen uit.           |

Afweging bij zoekdiepte:

| Diepte     | Snelheid | Relevantie | Beste voor                                      |
| ---------- | -------- | ---------- | ---------------------------------------------- |
| `basic`    | Sneller  | Hoog       | Algemene queries (standaard).                  |
| `advanced` | Langzamer | Hoogst    | Nauwkeurig onderzoek en feitenonderzoek.       |

### `tavily_extract`

Gebruik dit om schone content uit een of meer URL's te extraheren. Verwerkt door JavaScript gerenderde pagina's en ondersteunt querygerichte chunking voor gerichte extractie.

| Parameter           | Type         | Beperkingen / standaardwaarde | Beschrijving                                                 |
| ------------------- | ------------ | ----------------------------- | ------------------------------------------------------------ |
| `urls`              | string array | vereist, 1-20                 | URL's waaruit content moet worden geëxtraheerd.              |
| `query`             | string       | (optioneel)                   | Rangschik geëxtraheerde chunks opnieuw op relevantie voor deze query. |
| `extract_depth`     | enum         | `basic` (standaard), `advanced` | Gebruik `advanced` voor JS-intensieve pagina's, SPA's of dynamische tabellen. |
| `chunks_per_source` | integer      | 1-5; **vereist `query`**      | Chunks die per URL worden geretourneerd. Geeft een fout als dit zonder `query` is ingesteld. |
| `include_images`    | boolean      | standaard `false`             | Neem afbeeldings-URL's op in resultaten.                     |

Afweging bij extractiediepte:

| Diepte     | Wanneer te gebruiken                         |
| ---------- | -------------------------------------------- |
| `basic`    | Eenvoudige pagina's. Probeer dit eerst.      |
| `advanced` | Door JS gerenderde SPA's, dynamische content, tabellen. |

<Tip>
Verdeel grotere URL-lijsten over meerdere `tavily_extract`-aanroepen (maximaal 20 per request). Gebruik `query` plus `chunks_per_source` om alleen relevante content te krijgen in plaats van volledige pagina's.
</Tip>

## De juiste tool kiezen

| Behoefte                              | Tool             |
| ------------------------------------- | ---------------- |
| Snelle webzoekopdracht, geen speciale opties | `web_search`     |
| Zoeken met diepte, onderwerp, AI-antwoorden | `tavily_search`  |
| Content extraheren uit specifieke URL's | `tavily_extract` |

<Note>
De generieke `web_search`-tool met Tavily als provider ondersteunt `query` en `count` (tot 20 resultaten). Gebruik voor Tavily-specifieke instellingen (`search_depth`, `topic`, `include_answer`, domeinfilters, tijdbereik) in plaats daarvan `tavily_search`.
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="API key resolution order">
    De Tavily-client zoekt zijn API-sleutel in deze volgorde op:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (opgelost via SecretRefs).
    2. `TAVILY_API_KEY` uit de Gateway-omgeving.

    `tavily_extract` geeft een installatiefout als geen van beide aanwezig is.

  </Accordion>

  <Accordion title="Custom base URL">
    Overschrijf `plugins.entries.tavily.config.webSearch.baseUrl` als je Tavily via een proxy laat lopen. De standaardwaarde is `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` requires `query`">
    `tavily_extract` weigert aanroepen die `chunks_per_source` doorgeven zonder een `query`. Tavily rangschikt chunks op queryrelevantie, dus de parameter is zonder query betekenisloos.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Web Search overview" href="/nl/tools/web" icon="magnifying-glass">
    Alle providers en regels voor automatische detectie.
  </Card>
  <Card title="Firecrawl" href="/nl/tools/firecrawl" icon="fire">
    Zoeken plus scraping met contentextractie.
  </Card>
  <Card title="Exa Search" href="/nl/tools/exa-search" icon="binoculars">
    Neuraal zoeken met contentextractie.
  </Card>
  <Card title="Configuration" href="/nl/gateway/configuration" icon="gear">
    Volledig configschema voor Plugin-vermeldingen en toolroutering.
  </Card>
</CardGroup>
