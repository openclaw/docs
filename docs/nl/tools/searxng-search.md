---
read_when:
    - Je wilt een zelfgehoste webzoekprovider
    - U wilt SearXNG gebruiken voor web_search
    - Je hebt een privacygerichte of van het netwerk gescheiden zoekoptie nodig
summary: SearXNG-webzoekfunctie -- zelfgehoste metazoekprovider zonder API-sleutel
title: SearXNG-zoekopdracht
x-i18n:
    generated_at: "2026-05-02T11:30:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9be62f7398379e1672ea7e934a571a529cac07dc5d880ac74e51f8445594034
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw ondersteunt [SearXNG](https://docs.searxng.org/) als **zelf-gehoste,
sleutelvrije** `web_search`-provider. SearXNG is een open-source meta-zoekmachine
die resultaten van Google, Bing, DuckDuckGo en andere bronnen samenvoegt.

Voordelen:

- **Gratis en onbeperkt** -- geen API-sleutel of commercieel abonnement vereist
- **Privacy / air-gap** -- zoekopdrachten verlaten je netwerk nooit
- **Werkt overal** -- geen regiobeperkingen op commerciële zoek-API's

## Installatie

<Steps>
  <Step title="Run a SearXNG instance">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Of gebruik een bestaande SearXNG-deployment waartoe je toegang hebt. Zie de
    [SearXNG-documentatie](https://docs.searxng.org/) voor productie-installatie.

  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    Of stel de env var in en laat automatische detectie die vinden:

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

Instellingen op Plugin-niveau voor de SearXNG-instantie:

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
- `http://` wordt alleen geaccepteerd voor vertrouwde private-network- of loopback-hosts
- openbare SearXNG-hosts moeten `https://` gebruiken
- private/interne hosts gebruiken de zelf-gehoste netwerkbeveiliging; openbare `https://`-
  hosts blijven op de strikte webzoekbeveiliging en kunnen niet doorverwijzen naar private
  adressen

## Omgevingsvariabele

Stel `SEARXNG_BASE_URL` in als alternatief voor configuratie:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Wanneer `SEARXNG_BASE_URL` is ingesteld en er geen expliciete provider is geconfigureerd, kiest automatische detectie
SearXNG automatisch (met de laagste prioriteit -- elke API-ondersteunde provider met een
sleutel wint eerst).

## Referentie voor Plugin-configuratie

| Veld         | Beschrijving                                                        |
| ------------ | ------------------------------------------------------------------- |
| `baseUrl`    | Basis-URL van je SearXNG-instantie (vereist)                        |
| `categories` | Door komma's gescheiden categorieen zoals `general`, `news` of `science` |
| `language`   | Taalcode voor resultaten zoals `en`, `de` of `fr`                   |

## Opmerkingen

- **JSON-API** -- gebruikt het native `format=json`-endpoint van SearXNG, geen HTML-scraping
- **URL's van afbeeldingsresultaten** -- resultaten uit afbeeldingscategorieen bevatten `img_src` wanneer SearXNG
  een directe afbeeldings-URL retourneert
- **Geen API-sleutel** -- werkt direct met elke SearXNG-instantie
- **Validatie van basis-URL** -- `baseUrl` moet een geldige `http://`- of `https://`-
  URL zijn; openbare hosts moeten `https://` gebruiken
- **Netwerkbeveiliging** -- private/interne SearXNG-endpoints kiezen expliciet voor
  toegang tot private netwerken; openbare `https://` SearXNG-endpoints behouden strikte SSRF-
  bescherming
- **Volgorde van automatische detectie** -- SearXNG wordt als laatste gecontroleerd (volgorde 200) in
  automatische detectie. API-ondersteunde providers met geconfigureerde sleutels draaien eerst, daarna
  DuckDuckGo (volgorde 100), daarna Ollama Web Search (volgorde 110)
- **Zelf-gehost** -- jij beheert de instantie, zoekopdrachten en upstream-zoekmachines
- **Categorieen** gebruiken standaard `general` wanneer ze niet zijn geconfigureerd
- **Categoriefallback** -- als een categorieaanvraag anders dan `general` slaagt maar
  nul resultaten retourneert, probeert OpenClaw dezelfde zoekopdracht nog eenmaal met `general`
  voordat een lege resultatenset wordt geretourneerd

<Tip>
  Om de SearXNG JSON-API te laten werken, moet je ervoor zorgen dat je SearXNG-instantie de `json`-
  indeling heeft ingeschakeld in de `settings.yml` onder `search.formats`.
</Tip>

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [DuckDuckGo Search](/nl/tools/duckduckgo-search) -- nog een sleutelvrije fallback
- [Brave Search](/nl/tools/brave-search) -- gestructureerde resultaten met gratis laag
