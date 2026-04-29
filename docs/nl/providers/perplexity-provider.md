---
read_when:
    - Je wilt Perplexity configureren als webzoekprovider
    - Je hebt de Perplexity-API-sleutel of de OpenRouter-proxyconfiguratie nodig
summary: Instelling van de Perplexity-webzoekprovider (API-sleutel, zoekmodi, filtering)
title: Perplexity
x-i18n:
    generated_at: "2026-04-29T23:12:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36475ba0d6ab7d569f83b7f6fdc13c5dbe6b12ca5acab44e8d213da23d04a795
    source_path: providers/perplexity-provider.md
    workflow: 16
---

De Perplexity Plugin biedt webzoekmogelijkheden via de Perplexity
Search API of Perplexity Sonar via OpenRouter.

<Note>
Deze pagina is de configuratie van de Perplexity-**provider**. Zie [Perplexity-tool](/nl/tools/perplexity-search) voor de Perplexity-**tool** (hoe de agent die gebruikt).
</Note>

| Eigenschap  | Waarde                                                                 |
| ----------- | ---------------------------------------------------------------------- |
| Type        | Webzoekprovider (geen modelprovider)                                   |
| Auth        | `PERPLEXITY_API_KEY` (direct) of `OPENROUTER_API_KEY` (via OpenRouter) |
| Config-pad  | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## Aan de slag

<Steps>
  <Step title="Stel de API-sleutel in">
    Voer de interactieve configuratiestroom voor webzoeken uit:

    ```bash
    openclaw configure --section web
    ```

    Of stel de sleutel direct in:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Begin met zoeken">
    De agent gebruikt Perplexity automatisch voor webzoekopdrachten zodra de sleutel is
    geconfigureerd. Er zijn geen extra stappen vereist.
  </Step>
</Steps>

## Zoekmodi

De Plugin selecteert automatisch het transport op basis van het API-sleutelvoorvoegsel:

<Tabs>
  <Tab title="Native Perplexity API (pplx-)">
    Wanneer je sleutel begint met `pplx-`, gebruikt OpenClaw de native Perplexity Search
    API. Dit transport retourneert gestructureerde resultaten en ondersteunt domein-,
    taal- en datumfilters (zie de filteropties hieronder).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    Wanneer je sleutel begint met `sk-or-`, routeert OpenClaw via OpenRouter met het
    Perplexity Sonar-model. Dit transport retourneert door AI samengestelde antwoorden met
    citaties.
  </Tab>
</Tabs>

| Sleutelvoorvoegsel | Transport                    | Functies                                         |
| ------------------ | ---------------------------- | ------------------------------------------------ |
| `pplx-`            | Native Perplexity Search API | Gestructureerde resultaten, domein-/taal-/datumfilters |
| `sk-or-`           | OpenRouter (Sonar)           | Door AI samengestelde antwoorden met citaties    |

## Native API-filtering

<Note>
Filteropties zijn alleen beschikbaar wanneer je de native Perplexity API gebruikt
(`pplx-`-sleutel). OpenRouter/Sonar-zoekopdrachten ondersteunen deze parameters niet.
</Note>

Wanneer je de native Perplexity API gebruikt, ondersteunen zoekopdrachten de volgende filters:

| Filter         | Beschrijving                           | Voorbeeld                           |
| -------------- | -------------------------------------- | ----------------------------------- |
| Land           | 2-letterige landcode                   | `us`, `de`, `jp`                    |
| Taal           | ISO 639-1-taalcode                     | `en`, `fr`, `zh`                    |
| Datumbereik    | Recentheidsvenster                     | `day`, `week`, `month`, `year`      |
| Domeinfilters  | Allowlist of denylist (max. 20 domeinen) | `example.com`                       |
| Contentbudget  | Tokenlimieten per respons / per pagina | `max_tokens`, `max_tokens_per_page` |

## Geavanceerde configuratie

<AccordionGroup>
  <Accordion title="Omgevingsvariabele voor daemonprocessen">
    Als de OpenClaw Gateway als daemon draait (launchd/systemd), zorg er dan voor dat
    `PERPLEXITY_API_KEY` beschikbaar is voor dat proces.

    <Warning>
    Een sleutel die alleen in `~/.profile` is ingesteld, is niet zichtbaar voor een launchd/systemd-
    daemon tenzij die omgeving expliciet wordt geïmporteerd. Stel de sleutel in
    `~/.openclaw/.env` in of via `env.shellEnv` om ervoor te zorgen dat het gatewayproces deze kan
    lezen.
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter-proxyconfiguratie">
    Als je Perplexity-zoekopdrachten liever via OpenRouter routeert, stel dan een
    `OPENROUTER_API_KEY` (voorvoegsel `sk-or-`) in in plaats van een native Perplexity-sleutel.
    OpenClaw detecteert het voorvoegsel en schakelt automatisch over naar het Sonar-transport.

    <Tip>
    Het OpenRouter-transport is handig als je al een OpenRouter-account hebt
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
    Volledige configuratiereferentie inclusief Plugin-vermeldingen.
  </Card>
</CardGroup>
