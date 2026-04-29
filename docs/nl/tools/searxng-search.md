---
read_when:
    - Je wilt een zelfgehoste webzoekprovider
    - Je wilt SearXNG gebruiken voor web_search
    - Je hebt een privacygerichte of van het netwerk geïsoleerde zoekoptie nodig
summary: SearXNG-webzoekfunctie -- zelf gehoste metazoekprovider zonder sleutel
title: SearXNG-zoekopdracht
x-i18n:
    generated_at: "2026-04-29T23:26:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: a07198ef7a6f363b9e5e78e57e6e31f193f8f10882945208191c8baea5fe67d6
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw ondersteunt [SearXNG](https://docs.searxng.org/) als een **zelfgehoste,
sleutelvrije** `web_search`-provider. SearXNG is een opensource meta-zoekmachine
die resultaten verzamelt van Google, Bing, DuckDuckGo en andere bronnen.

Voordelen:

- **Gratis en onbeperkt** -- geen API-sleutel of commercieel abonnement vereist
- **Privacy / air-gap** -- zoekopdrachten verlaten je netwerk nooit
- **Werkt overal** -- geen regiobeperkingen voor commerciële zoek-API's

## Instellen

<Steps>
  <Step title="Een SearXNG-instantie uitvoeren">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Of gebruik een bestaande SearXNG-deployment waartoe je toegang hebt. Zie de
    [SearXNG-documentatie](https://docs.searxng.org/) voor productie-instelling.

  </Step>
  <Step title="Configureren">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    Of stel de env var in en laat automatische detectie deze vinden:

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

- `https://` werkt voor openbare of prive-SearXNG-hosts
- `http://` wordt alleen geaccepteerd voor vertrouwde private-netwerk- of local loopback-hosts
- openbare SearXNG-hosts moeten `https://` gebruiken

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
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | Basis-URL van je SearXNG-instantie (vereist)                       |
| `categories` | Door komma's gescheiden categorieen zoals `general`, `news` of `science` |
| `language`   | Taalcode voor resultaten zoals `en`, `de` of `fr`                  |

## Opmerkingen

- **JSON-API** -- gebruikt SearXNG's native `format=json`-endpoint, niet HTML-scraping
- **Geen API-sleutel** -- werkt direct met elke SearXNG-instantie
- **Validatie van basis-URL** -- `baseUrl` moet een geldige `http://`- of `https://`
  URL zijn; openbare hosts moeten `https://` gebruiken
- **Volgorde voor automatische detectie** -- SearXNG wordt als laatste gecontroleerd (volgorde 200) in
  automatische detectie. API-ondersteunde providers met geconfigureerde sleutels worden eerst uitgevoerd, daarna
  DuckDuckGo (volgorde 100), daarna Ollama Web Search (volgorde 110)
- **Zelfgehost** -- jij beheert de instantie, zoekopdrachten en upstream-zoekmachines
- **Categorieen** zijn standaard `general` wanneer ze niet zijn geconfigureerd

<Tip>
  Om de SearXNG JSON-API te laten werken, zorg je ervoor dat je SearXNG-instantie de `json`-
  indeling heeft ingeschakeld in de `settings.yml` onder `search.formats`.
</Tip>

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [DuckDuckGo Search](/nl/tools/duckduckgo-search) -- nog een sleutelvrije fallback
- [Brave Search](/nl/tools/brave-search) -- gestructureerde resultaten met gratis laag
