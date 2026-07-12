---
read_when:
    - U wilt een zelfgehoste webzoekprovider
    - Je wilt SearXNG gebruiken voor web_search
    - Je hebt een privacygerichte zoekoptie nodig die in een geïsoleerde omgeving kan worden gebruikt
summary: SearXNG-webzoekfunctie -- zelfgehoste metazoekprovider zonder sleutel
title: SearXNG-zoeken
x-i18n:
    generated_at: "2026-07-12T09:30:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cae8de9f8e2c8dd9cec615adb48da5c1fd7654bffe96c7afc1acea3effbcf1fc
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw ondersteunt [SearXNG](https://docs.searxng.org/) als een **zelfgehoste,
sleutelvrije** `web_search`-provider. SearXNG is een opensource metazoekmachine
die resultaten van Google, Bing, DuckDuckGo en andere bronnen samenvoegt.

Voordelen:

- **Gratis en onbeperkt** -- geen API-sleutel of commercieel abonnement vereist
- **Privacy / airgap** -- zoekopdrachten verlaten uw netwerk nooit
- **Werkt overal** -- geen regiobeperkingen van commerciële zoek-API's

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

    U kunt ook een bestaande SearXNG-implementatie gebruiken waartoe u toegang hebt. Raadpleeg de
    [SearXNG-documentatie](https://docs.searxng.org/) voor installatie in een productieomgeving.

  </Step>
  <Step title="Configureren">
    ```bash
    openclaw configure --section web
    # Selecteer "searxng" als provider
    ```

    U kunt ook de omgevingsvariabele instellen en deze automatisch laten detecteren:

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
            categories: "general,news", // optioneel
            language: "en", // optioneel
          },
        },
      },
    },
  },
}
```

`baseUrl` accepteert ook een SecretRef-object (bijvoorbeeld `{ source: "env", id: "SEARXNG_BASE_URL" }`).

## Omgevingsvariabele

Stel `SEARXNG_BASE_URL` in als alternatief voor de configuratie:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Volgorde van resolutie: de geconfigureerde `baseUrl`-tekenreeks, vervolgens een inline SecretRef voor een omgevingsvariabele in
`baseUrl` en daarna `SEARXNG_BASE_URL`. Wanneer geen van de configuratiepaden is ingesteld en
`SEARXNG_BASE_URL` aanwezig is zonder dat expliciet een provider is gekozen, selecteert de automatische detectie
SearXNG.

## Naslag voor Plugin-configuratie

| Veld         | Beschrijving                                                       |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | Basis-URL van uw SearXNG-instantie (vereist)                       |
| `categories` | Kommaggescheiden categorieën zoals `general`, `news` of `science`  |
| `language`   | Taalcode voor resultaten, zoals `en`, `de` of `fr`                 |

De aanroep van de tool `web_search` accepteert ook `count` (1-10 resultaten), `categories`
en `language` als overschrijvingen per aanroep.

## Opmerkingen

- **JSON-API** -- gebruikt het systeemeigen `format=json`-eindpunt van SearXNG, niet het scrapen van HTML
- **URL's van afbeeldingsresultaten** -- resultaten in de afbeeldingscategorie bevatten `img_src` wanneer SearXNG
  een directe afbeeldings-URL retourneert
- **Geen API-sleutel** -- werkt direct met elke SearXNG-instantie
- **Validatie van de basis-URL** -- `baseUrl` moet een geldige `http://`- of `https://`-
  URL zijn
- **Netwerkbeveiliging** -- `http://`-basis-URL's moeten verwijzen naar een vertrouwde privéhost of
  local loopback-host (openbare hosts moeten `https://` gebruiken); `https://`-basis-URL's die
  naar een privé- of intern adres worden omgezet, krijgen dezelfde toestemming voor zelfhosting,
  terwijl voor `https://`-basis-URL's die naar een openbaar adres worden omgezet strikte SSRF-bescherming blijft gelden
- **Volgorde van automatische detectie** -- SearXNG vereist een geconfigureerde `baseUrl` (volgorde
  200 onder providers die al over de vereiste referentiegegevens beschikken). Sleutelvrije
  providers zoals DuckDuckGo of Ollama Web Search worden nooit impliciet via automatische detectie gekozen;
  ze worden alleen geactiveerd door een expliciete keuze voor `provider`
- **Zelfgehost** -- u beheert de instantie, zoekopdrachten en bovenliggende zoekmachines
- **Categorieën** zijn standaard ingesteld op `general` wanneer ze niet zijn geconfigureerd
- **Terugval voor categorieën** -- als een aanvraag voor een andere categorie dan `general` slaagt maar
  geen resultaten oplevert, probeert OpenClaw dezelfde zoekopdracht eenmaal opnieuw met `general`
  voordat een lege resultatenset wordt geretourneerd
- **Resultaatcaching** -- identieke zoekopdrachten (dezelfde zoekopdracht, hetzelfde aantal, dezelfde categorieën,
  dezelfde taal en dezelfde basis-URL) worden gedurende een korte TTL in het proces gecachet
- **Versievereiste** -- de Plugin declareert `minHostVersion: >=2026.6.9`

<Tip>
  Om de SearXNG JSON-API te laten werken, moet u ervoor zorgen dat voor uw SearXNG-instantie de `json`-
  indeling is ingeschakeld in `settings.yml` onder `search.formats`.
</Tip>

## Gerelateerd

- [Overzicht van zoeken op het web](/nl/tools/web) -- alle providers en automatische detectie
- [Zoeken met DuckDuckGo](/nl/tools/duckduckgo-search) -- nog een sleutelvrije provider
- [Zoeken met Brave](/nl/tools/brave-search) -- gestructureerde resultaten met een gratis abonnementsniveau
