---
read_when:
    - U wilt webzoekopdrachten met Tavily als backend
    - Je hebt een Tavily-API-sleutel nodig
    - Je wilt Tavily als web_search-provider
    - U wilt inhoud uit URL's extraheren
summary: Tavily-zoek- en extractietools
title: Tavily
x-i18n:
    generated_at: "2026-07-12T09:31:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a61351872eb8aecb0b3ada9b573ee8d3db1dcec3d7bd74074446fbe9dc1f274
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) is een zoek-API die is ontworpen voor AI-toepassingen. OpenClaw biedt deze op twee manieren aan:

- als de `web_search`-provider voor de algemene zoektool
- als expliciete plugintools: `tavily_search` en `tavily_extract`

Tavily retourneert gestructureerde resultaten die zijn geoptimaliseerd voor verwerking door LLM's, met configureerbare zoekdiepte, onderwerpfiltering, domeinfilters, door AI gegenereerde antwoordsamenvattingen en inhoudsextractie uit URL's (inclusief pagina's die met JavaScript worden gerenderd).

| Eigenschap | Waarde                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------- |
| Plugin-id  | `tavily`                                                                                                |
| Pakket     | `@openclaw/tavily-plugin`                                                                               |
| Authenticatie | omgevingsvariabele `TAVILY_API_KEY` of configuratieoptie `apiKey`                                   |
| Basis-URL  | `https://api.tavily.com` (standaard); omgevingsvariabele `TAVILY_BASE_URL` of configuratieoptie `baseUrl` om deze te overschrijven |
| Time-outs  | 30 s voor zoeken, 60 s voor extractie (standaard)                                                       |
| Tools      | `tavily_search`, `tavily_extract`                                                                       |

## Aan de slag

<Steps>
  <Step title="Installeer de plugin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="Verkrijg een API-sleutel">
    Maak een Tavily-account aan op [tavily.com](https://tavily.com) en genereer vervolgens een API-sleutel in het dashboard.
  </Step>
  <Step title="Configureer de plugin en provider">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // optioneel als TAVILY_API_KEY is ingesteld
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
  <Step title="Controleer of zoekopdrachten worden uitgevoerd">
    Activeer een `web_search` vanuit een willekeurige agent of roep `tavily_search` rechtstreeks aan.
  </Step>
</Steps>

<Tip>
Als je Tavily kiest tijdens de onboarding of via `openclaw configure --section web`, wordt de officiële Tavily-plugin indien nodig geïnstalleerd en ingeschakeld.
</Tip>

## Toolreferentie

### `tavily_search`

Gebruik dit wanneer je Tavily-specifieke zoekinstellingen wilt gebruiken in plaats van de algemene `web_search`.

| Parameter         | Type         | Beperkingen / standaardwaarde           | Beschrijving                                           |
| ----------------- | ------------ | --------------------------------------- | ------------------------------------------------------ |
| `query`           | tekenreeks   | vereist                                 | Tekenreeks voor de zoekopdracht.                       |
| `search_depth`    | enum         | `basic` (standaard), `advanced`         | `advanced` is langzamer, maar relevanter.              |
| `topic`           | enum         | `general` (standaard), `news`, `finance` | Filter op onderwerpcategorie.                         |
| `max_results`     | geheel getal | 1-20, standaard `5`                     | Aantal resultaten.                                     |
| `include_answer`  | booleaans    | standaard `false`                       | Voeg een door Tavily AI gegenereerde antwoordsamenvatting toe. |
| `time_range`      | enum         | `day`, `week`, `month`, `year`          | Filter resultaten op actualiteit.                      |
| `include_domains` | tekenreeksmatrix | (geen)                              | Neem alleen resultaten uit deze domeinen op.           |
| `exclude_domains` | tekenreeksmatrix | (geen)                              | Sluit resultaten uit deze domeinen uit.                |

Afweging bij zoekdiepte:

| Diepte     | Snelheid | Relevantie | Het meest geschikt voor                    |
| ---------- | -------- | ---------- | ------------------------------------------- |
| `basic`    | Sneller  | Hoog       | Algemene zoekopdrachten (standaard).        |
| `advanced` | Langzamer | Hoogst    | Nauwkeurig onderzoek en feitenonderzoek.    |

### `tavily_extract`

Gebruik dit om opgeschoonde inhoud uit een of meer URL's te extraheren. Verwerkt pagina's die met JavaScript worden gerenderd en ondersteunt op zoekopdrachten gerichte segmentering voor doelgerichte extractie.

| Parameter           | Type              | Beperkingen / standaardwaarde  | Beschrijving                                                  |
| ------------------- | ----------------- | ------------------------------ | ------------------------------------------------------------- |
| `urls`              | tekenreeksmatrix  | vereist, 1-20                  | URL's waaruit inhoud moet worden geëxtraheerd.                |
| `query`             | tekenreeks        | (optioneel)                    | Rangschik geëxtraheerde segmenten opnieuw op relevantie voor deze zoekopdracht. |
| `extract_depth`     | enum              | `basic` (standaard), `advanced` | Gebruik `advanced` voor pagina's met veel JS, SPA's of dynamische tabellen. |
| `chunks_per_source` | geheel getal      | 1-5; **vereist `query`**       | Aantal geretourneerde segmenten per URL. Geeft een fout als dit zonder `query` wordt ingesteld. |
| `include_images`    | booleaans         | standaard `false`              | Neem afbeeldings-URL's op in de resultaten.                  |

Afweging bij extractiediepte:

| Diepte     | Wanneer te gebruiken                           |
| ---------- | ---------------------------------------------- |
| `basic`    | Eenvoudige pagina's. Probeer dit eerst.        |
| `advanced` | Met JS gerenderde SPA's, dynamische inhoud en tabellen. |

<Tip>
Verdeel grotere URL-lijsten over meerdere aanroepen van `tavily_extract` (maximaal 20 per aanvraag). Gebruik `query` samen met `chunks_per_source` om alleen relevante inhoud te verkrijgen in plaats van volledige pagina's.
</Tip>

## De juiste tool kiezen

| Behoefte                                      | Tool              |
| --------------------------------------------- | ----------------- |
| Snel zoeken op het web, zonder speciale opties | `web_search`     |
| Zoeken met diepte, onderwerp en AI-antwoorden | `tavily_search`   |
| Inhoud uit specifieke URL's extraheren        | `tavily_extract`  |

<Note>
De algemene tool `web_search` met Tavily als provider ondersteunt `query` en `count` (maximaal 20 resultaten). Gebruik in plaats daarvan `tavily_search` voor Tavily-specifieke instellingen (`search_depth`, `topic`, `include_answer`, domeinfilters en tijdsbereik).
</Note>

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Volgorde voor het bepalen van de API-sleutel">
    De Tavily-client zoekt in deze volgorde naar de API-sleutel:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (opgelost via SecretRefs).
    2. `TAVILY_API_KEY` uit de Gateway-omgeving.

    Zowel `tavily_search` als `tavily_extract` geeft een configuratiefout als geen van beide aanwezig is.

  </Accordion>

  <Accordion title="Aangepaste basis-URL">
    Overschrijf `plugins.entries.tavily.config.webSearch.baseUrl` of stel `TAVILY_BASE_URL` in als je Tavily via een proxy ontsluit. De configuratie heeft voorrang op de omgevingsvariabele. De standaardwaarde is `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` vereist `query`">
    `tavily_extract` weigert aanroepen die `chunks_per_source` doorgeven zonder een `query`. Tavily rangschikt segmenten op relevantie voor de zoekopdracht, waardoor de parameter zonder zoekopdracht geen betekenis heeft.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Overzicht van zoeken op het web" href="/nl/tools/web" icon="magnifying-glass">
    Alle providers en regels voor automatische detectie.
  </Card>
  <Card title="Firecrawl" href="/nl/tools/firecrawl" icon="fire">
    Zoeken en scrapen met inhoudsextractie.
  </Card>
  <Card title="Exa Search" href="/nl/tools/exa-search" icon="binoculars">
    Neuraal zoeken met inhoudsextractie.
  </Card>
  <Card title="Configuratie" href="/nl/gateway/configuration" icon="gear">
    Volledig configuratieschema voor pluginvermeldingen en toolroutering.
  </Card>
</CardGroup>
