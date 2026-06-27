---
read_when:
    - Je wilt een zelfgehoste webzoekprovider
    - Je wilt SearXNG gebruiken voor web_search
    - Je hebt een privacygerichte of van het internet geïsoleerde zoekoptie nodig
summary: SearXNG-webzoekopdracht -- zelfgehoste, sleutelvrije metazoekprovider
title: SearXNG-zoekopdracht
x-i18n:
    generated_at: "2026-06-27T18:29:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4bd00a20e45f71b7bd855a6588d5c829a0202839fc93ddcec1e255b7858ff183
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw ondersteunt [SearXNG](https://docs.searxng.org/) als een **zelf gehoste,
sleutelvrije** `web_search`-aanbieder. SearXNG is een open-source metazoekmachine
die resultaten uit Google, Bing, DuckDuckGo en andere bronnen samenvoegt.

Voordelen:

- **Gratis en onbeperkt** -- geen API-sleutel of commercieel abonnement vereist
- **Privacy / air-gap** -- zoekopdrachten verlaten nooit je netwerk
- **Werkt overal** -- geen regiobeperkingen op commerciële zoek-API's

## Installatie

<Steps>
  <Step title="Installeer de Plugin">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="Voer een SearXNG-instantie uit">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Of gebruik een bestaande SearXNG-implementatie waartoe je toegang hebt. Zie de
    [SearXNG-documentatie](https://docs.searxng.org/) voor productie-installatie.

  </Step>
  <Step title="Configureer">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    Of stel de omgevingsvariabele in en laat automatische detectie deze vinden:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## Configuratie

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

Plugin-niveau-instellingen voor de SearXNG-instantie:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

Het veld `baseUrl` accepteert ook SecretRef-objecten.

Transportregels:

- `https://` werkt voor openbare of private SearXNG-hosts
- `http://` wordt alleen geaccepteerd voor vertrouwde private-netwerk- of loopback-hosts
- openbare SearXNG-hosts moeten `https://` gebruiken
- private/interne hosts gebruiken de zelf gehoste netwerkbeveiliging; openbare `https://`-hosts
  blijven onder de strikte webzoekbeveiliging en kunnen niet doorverwijzen naar private
  adressen

## Omgevingsvariabele

Stel `SEARXNG_BASE_URL` in als alternatief voor configuratie:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Wanneer `SEARXNG_BASE_URL` is ingesteld en er geen expliciete aanbieder is geconfigureerd, kiest automatische detectie
SearXNG automatisch (met de laagste prioriteit -- elke door een API ondersteunde aanbieder met een
sleutel wint eerst).

## Referentie voor Plugin-configuratie

| Veld         | Beschrijving                                                      |
| ------------ | ----------------------------------------------------------------- |
| `baseUrl`    | Basis-URL van je SearXNG-instantie (vereist)                     |
| `categories` | Komma-gescheiden categorieen zoals `general`, `news` of `science` |
| `language`   | Taalcode voor resultaten zoals `en`, `de` of `fr`                 |

## Opmerkingen

- **JSON-API** -- gebruikt SearXNG's native `format=json`-endpoint, geen HTML-scraping
- **URL's van afbeeldingsresultaten** -- resultaten in afbeeldingscategorieen bevatten `img_src` wanneer SearXNG
  een directe afbeeldings-URL retourneert
- **Geen API-sleutel** -- werkt direct met elke SearXNG-instantie
- **Validatie van basis-URL** -- `baseUrl` moet een geldige `http://`- of `https://`-URL zijn;
  openbare hosts moeten `https://` gebruiken
- **Netwerkbeveiliging** -- private/interne SearXNG-endpoints kiezen voor
  private-netwerktoegang; openbare `https://` SearXNG-endpoints behouden strikte SSRF-
  bescherming
- **Volgorde van automatische detectie** -- SearXNG wordt gecontroleerd na door API ondersteunde aanbieders
  met geconfigureerde sleutels (volgorde 200). Sleutelvrije aanbieders zoals DuckDuckGo of
  Ollama Web Search worden niet automatisch geselecteerd zonder expliciete aanbiederskeuze
- **Zelf gehost** -- jij beheert de instantie, zoekopdrachten en upstream zoekmachines
- **Categorieen** staan standaard op `general` wanneer ze niet zijn geconfigureerd
- **Categoriefallback** -- als een categorieaanvraag anders dan `general` slaagt maar
  nul resultaten retourneert, probeert OpenClaw dezelfde zoekopdracht nog een keer met `general`
  voordat een lege resultatenset wordt geretourneerd

<Tip>
  Zorg ervoor dat je SearXNG-instantie de `json`-indeling heeft ingeschakeld in
  `settings.yml` onder `search.formats`, zodat de SearXNG JSON-API werkt.
</Tip>

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle aanbieders en automatische detectie
- [DuckDuckGo Search](/nl/tools/duckduckgo-search) -- nog een sleutelvrije aanbieder
- [Brave Search](/nl/tools/brave-search) -- gestructureerde resultaten met gratis laag
