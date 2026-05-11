---
read_when:
    - Je wilt door Tavily ondersteund zoeken op het web
    - Je hebt een Tavily-API-sleutel nodig
    - Je wilt Tavily als web_search-provider
    - Je wilt inhoudsextractie uit URL's
summary: Zoek- en extractiehulpmiddelen van Tavily
title: Tavily
x-i18n:
    generated_at: "2026-05-11T20:54:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 071e2b1be054890711e32d7424d16d94133d16ff1ce7da3703e62c53b5c217ef
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) is een zoek-API ontworpen voor AI-toepassingen. OpenClaw stelt deze op twee manieren beschikbaar:

- als de `web_search`-provider voor de generieke zoektool
- als expliciete Plugin-tools: `tavily_search` en `tavily_extract`

Tavily retourneert gestructureerde resultaten die zijn geoptimaliseerd voor LLM-gebruik, met configureerbare zoekdiepte, onderwerpfiltering, domeinfilters, door AI gegenereerde antwoordsamenvattingen en inhoudsextractie uit URL's (inclusief door JavaScript gerenderde pagina's).

| Eigenschap       | Waarde                              |
| ---------------- | ----------------------------------- |
| Plugin-id        | `tavily`                            |
| Auth             | `TAVILY_API_KEY` of config `apiKey` |
| Basis-URL        | `https://api.tavily.com` (standaard) |
| Gebundelde tools | `tavily_search`, `tavily_extract`   |

## Aan de slag

<Steps>
  <Step title="Een API-sleutel verkrijgen">
    Maak een Tavily-account aan op [tavily.com](https://tavily.com) en genereer vervolgens een API-sleutel in het dashboard.
  </Step>
  <Step title="De Plugin en provider configureren">
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
  <Step title="Controleren of zoeken werkt">
    Activeer een `web_search` vanuit een willekeurige agent, of roep `tavily_search` rechtstreeks aan.
  </Step>
</Steps>

<Tip>
Als je Tavily kiest tijdens onboarding of via `openclaw configure --section web`, wordt de gebundelde Tavily-Plugin automatisch ingeschakeld.
</Tip>

## Toolreferentie

### `tavily_search`

Gebruik dit wanneer je Tavily-specifieke zoekinstellingen wilt in plaats van generieke `web_search`.

| Parameter         | Type         | Beperkingen / standaard              | Beschrijving                                   |
| ----------------- | ------------ | ------------------------------------ | ---------------------------------------------- |
| `query`           | string       | vereist                             | Zoekquerytekenreeks. Houd deze onder 400 tekens. |
| `search_depth`    | enum         | `basic` (standaard), `advanced`      | `advanced` is langzamer, maar relevanter.      |
| `topic`           | enum         | `general` (standaard), `news`, `finance` | Filter op onderwerpfamilie.                    |
| `max_results`     | integer      | 1-20                                 | Aantal resultaten.                             |
| `include_answer`  | boolean      | standaard `false`                    | Voeg een door Tavily AI gegenereerde antwoordsamenvatting toe. |
| `time_range`      | enum         | `day`, `week`, `month`, `year`       | Filter resultaten op recentheid.               |
| `include_domains` | string array | (geen)                               | Neem alleen resultaten van deze domeinen op.   |
| `exclude_domains` | string array | (geen)                               | Sluit resultaten van deze domeinen uit.        |

Afweging bij zoekdiepte:

| Diepte     | Snelheid  | Relevantie | Beste voor                            |
| ---------- | --------- | ---------- | ------------------------------------- |
| `basic`    | Sneller   | Hoog       | Algemene query's (standaard).         |
| `advanced` | Langzamer | Hoogst     | Precisieonderzoek en feitenonderzoek. |

### `tavily_extract`

Gebruik dit om schone inhoud uit een of meer URL's te extraheren. Verwerkt door JavaScript gerenderde pagina's en ondersteunt querygerichte chunking voor gerichte extractie.

| Parameter           | Type         | Beperkingen / standaard        | Beschrijving                                               |
| ------------------- | ------------ | ------------------------------ | ---------------------------------------------------------- |
| `urls`              | string array | vereist, 1-20                  | URL's waaruit inhoud moet worden geëxtraheerd.             |
| `query`             | string       | (optioneel)                    | Herorden geëxtraheerde chunks op relevantie voor deze query. |
| `extract_depth`     | enum         | `basic` (standaard), `advanced` | Gebruik `advanced` voor JS-zware pagina's, SPA's of dynamische tabellen. |
| `chunks_per_source` | integer      | 1-5; **vereist `query`**       | Geretourneerde chunks per URL. Geeft fouten als dit zonder `query` is ingesteld. |
| `include_images`    | boolean      | standaard `false`              | Neem afbeeldings-URL's op in resultaten.                   |

Afweging bij extractiediepte:

| Diepte     | Wanneer gebruiken                         |
| ---------- | ----------------------------------------- |
| `basic`    | Eenvoudige pagina's. Probeer dit eerst.   |
| `advanced` | Door JS gerenderde SPA's, dynamische inhoud, tabellen. |

<Tip>
Splits grotere URL-lijsten op in meerdere `tavily_extract`-aanroepen (maximaal 20 per verzoek). Gebruik `query` plus `chunks_per_source` om alleen relevante inhoud te krijgen in plaats van volledige pagina's.
</Tip>

## De juiste tool kiezen

| Behoefte                              | Tool             |
| ------------------------------------- | ---------------- |
| Snelle webzoekopdracht, geen speciale opties | `web_search`     |
| Zoeken met diepte, onderwerp, AI-antwoorden | `tavily_search`  |
| Inhoud uit specifieke URL's extraheren | `tavily_extract` |

<Note>
De generieke `web_search`-tool met Tavily als provider ondersteunt `query` en `count` (tot 20 resultaten). Gebruik voor Tavily-specifieke instellingen (`search_depth`, `topic`, `include_answer`, domeinfilters, tijdsbereik) in plaats daarvan `tavily_search`.
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Volgorde voor het oplossen van API-sleutels">
    De Tavily-client zoekt de API-sleutel in deze volgorde op:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (opgelost via SecretRefs).
    2. `TAVILY_API_KEY` uit de Gateway-omgeving.

    `tavily_extract` geeft een configuratiefout als geen van beide aanwezig is.

  </Accordion>

  <Accordion title="Aangepaste basis-URL">
    Overschrijf `plugins.entries.tavily.config.webSearch.baseUrl` als je Tavily via een proxy aanbiedt. De standaardwaarde is `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` vereist `query`">
    `tavily_extract` weigert aanroepen die `chunks_per_source` doorgeven zonder een `query`. Tavily rangschikt chunks op queryrelevantie, dus de parameter is betekenisloos zonder query.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Overzicht van Web Search" href="/nl/tools/web" icon="magnifying-glass">
    Alle providers en regels voor automatische detectie.
  </Card>
  <Card title="Firecrawl" href="/nl/tools/firecrawl" icon="fire">
    Zoeken plus scraping met inhoudsextractie.
  </Card>
  <Card title="Exa Search" href="/nl/tools/exa-search" icon="binoculars">
    Neuraal zoeken met inhoudsextractie.
  </Card>
  <Card title="Configuratie" href="/nl/gateway/configuration" icon="gear">
    Volledig configuratieschema voor Plugin-vermeldingen en toolroutering.
  </Card>
</CardGroup>
