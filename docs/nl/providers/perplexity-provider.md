---
read_when:
    - Je wilt Perplexity configureren als webzoekprovider
    - Je hebt de Perplexity API-sleutel of de OpenRouter-proxyconfiguratie nodig
summary: Perplexity webzoekprovider instellen (API-sleutel, zoekmodi, filtering)
title: Perplexity
x-i18n:
    generated_at: "2026-06-27T18:14:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3be6f5066ba180a63ea8b374f641613c815be0f84ee1d3577feea04e31ab4694
    source_path: providers/perplexity-provider.md
    workflow: 16
---

De Perplexity-plugin biedt mogelijkheden voor zoeken op het web via de Perplexity
Search API of Perplexity Sonar via OpenRouter.

<Note>
Deze pagina beschrijft de configuratie van de Perplexity-**provider**. Zie [Perplexity-tool](/nl/tools/perplexity-search) voor de Perplexity-**tool** (hoe de agent die gebruikt).
</Note>

| Eigenschap | Waarde |
| ----------- | ---------------------------------------------------------------------- |
| Type | Provider voor zoeken op het web (geen modelprovider) |
| Auth | `PERPLEXITY_API_KEY` (direct) of `OPENROUTER_API_KEY` (via OpenRouter) |
| Configuratiepad | `plugins.entries.perplexity.config.webSearch.apiKey` |

## Plugin installeren

Installeer de officiële Plugin en herstart daarna Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Aan de slag

<Steps>
  <Step title="De API-sleutel instellen">
    Voer de interactieve configuratiestroom voor zoeken op het web uit:

    ```bash
    openclaw configure --section web
    ```

    Of stel de sleutel direct in:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Beginnen met zoeken">
    De agent gebruikt Perplexity automatisch voor zoekopdrachten op het web zodra de sleutel is
    geconfigureerd. Er zijn geen extra stappen vereist.
  </Step>
</Steps>

## Zoekmodi

De plugin selecteert automatisch het transport op basis van het API-sleutelvoorvoegsel:

<Tabs>
  <Tab title="Native Perplexity API (pplx-)">
    Wanneer je sleutel begint met `pplx-`, gebruikt OpenClaw de native Perplexity Search
    API. Dit transport retourneert gestructureerde resultaten en ondersteunt domein-, taal-
    en datumfilters (zie de filteropties hieronder).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Wanneer je sleutel begint met `sk-or-`, routeert OpenClaw via OpenRouter met
    het Perplexity Sonar-model. Dit transport retourneert door AI samengestelde antwoorden met
    citaties.
  </Tab>
</Tabs>

| Sleutelvoorvoegsel | Transport | Functies |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-` | Native Perplexity Search API | Gestructureerde resultaten, domein-/taal-/datumfilters |
| `sk-or-` | OpenRouter (Sonar) | Door AI samengestelde antwoorden met citaties |

## Filteren met de native API

<Note>
Filteropties zijn alleen beschikbaar wanneer je de native Perplexity API gebruikt
(`pplx-`-sleutel). OpenRouter/Sonar-zoekopdrachten ondersteunen deze parameters niet.
</Note>

Bij gebruik van de native Perplexity API ondersteunen zoekopdrachten de volgende filters:

| Filter | Beschrijving | Voorbeeld |
| -------------- | -------------------------------------- | ----------------------------------- |
| Land | Landcode van 2 letters | `us`, `de`, `jp` |
| Taal | ISO 639-1-taalcode | `en`, `fr`, `zh` |
| Datumbereik | Recency-venster | `day`, `week`, `month`, `year` |
| Domeinfilters | Toestemmingslijst of blokkeerlijst (max. 20 domeinen) | `example.com` |
| Contentbudget | Tokenlimieten per antwoord / per pagina | `max_tokens`, `max_tokens_per_page` |

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Omgevingsvariabele voor daemonprocessen">
    Als de OpenClaw Gateway als daemon draait (launchd/systemd), zorg er dan voor dat
    `PERPLEXITY_API_KEY` beschikbaar is voor dat proces.

    <Warning>
    Een sleutel die alleen in een interactieve shell is geëxporteerd, is niet zichtbaar voor een
    launchd/systemd-daemon tenzij die omgeving expliciet wordt geïmporteerd. Stel
    de sleutel in `~/.openclaw/.env` of via `env.shellEnv` in om ervoor te zorgen dat het gateway-
    proces deze kan lezen.
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter-proxy instellen">
    Als je Perplexity-zoekopdrachten liever via OpenRouter routeert, stel dan een
    `OPENROUTER_API_KEY` (voorvoegsel `sk-or-`) in in plaats van een native Perplexity-sleutel.
    OpenClaw detecteert het voorvoegsel en schakelt automatisch over naar het Sonar-transport.

    <Tip>
    Het OpenRouter-transport is nuttig als je al een OpenRouter-account hebt
    en geconsolideerde facturering voor meerdere providers wilt.
    </Tip>

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Perplexity-zoektool" href="/nl/tools/perplexity-search" icon="magnifying-glass">
    Hoe de agent Perplexity-zoekopdrachten aanroept en resultaten interpreteert.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige configuratiereferentie inclusief pluginvermeldingen.
  </Card>
</CardGroup>
