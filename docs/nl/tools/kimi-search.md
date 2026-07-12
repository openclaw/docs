---
read_when:
    - Je wilt Kimi gebruiken voor web_search
    - Je hebt een KIMI_API_KEY of MOONSHOT_API_KEY nodig
summary: Kimi-webzoekfunctie via Moonshot-webzoekfunctie
title: Kimi-zoekopdracht
x-i18n:
    generated_at: "2026-07-12T09:29:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi is een `web_search`-provider die gebruikmaakt van de ingebouwde webzoekfunctie van Moonshot. Moonshot
stelt één antwoord met inline bronverwijzingen samen, vergelijkbaar met de
providers voor onderbouwde antwoorden van Gemini en Grok, in plaats van een gerangschikte resultatenlijst te retourneren.

## Instellen

<Steps>
  <Step title="Een sleutel maken">
    Haal een API-sleutel op bij [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="De sleutel opslaan">
    Stel `KIMI_API_KEY` of `MOONSHOT_API_KEY` in de Gateway-omgeving in (voeg deze bij een
    Gateway-installatie toe aan `~/.openclaw/.env`), of configureer dit via:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Wanneer u **Kimi** kiest tijdens `openclaw onboard` of `openclaw configure --section web`,
wordt ook gevraagd om:

- de Moonshot API-regio: `https://api.moonshot.ai/v1` of `https://api.moonshot.cn/v1`
- het webzoekmodel (standaard `kimi-k2.6`)

## Configuratie

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optioneel als KIMI_API_KEY of MOONSHOT_API_KEY is ingesteld
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

`tools.web.search.provider` wordt bij weglating automatisch gedetecteerd aan de hand van beschikbare API-sleutels;
stel deze expliciet in op `kimi` als meerdere zoekreferenties zijn geconfigureerd.

De equivalente bereikgebonden vorm onder `tools.web.search.kimi` (`apiKey`, `baseUrl`, `model`)
werkt ook; beide structuren worden samengevoegd tot dezelfde opgeloste configuratie.

Standaardwaarden: bij weglating is `baseUrl` standaard `https://api.moonshot.ai/v1` en
`model` standaard `kimi-k2.6`.

Als chatverkeer de Chinese host gebruikt (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), gebruikt Kimi `web_search` die host automatisch opnieuw
wanneer de eigen `baseUrl` niet is ingesteld, zodat `.cn`-sleutels niet per ongeluk het
internationale eindpunt benaderen (dat voor die sleutels HTTP 401 retourneert). Stel een expliciete
Kimi-`baseUrl` in om deze overname te overschrijven.

## Vereiste voor onderbouwing

OpenClaw retourneert alleen een Kimi-`web_search`-resultaat nadat het antwoord van Moonshot
ingebouwd bewijs van webzoekonderbouwing bevat, zoals het opnieuw afspelen van een `$web_search`-toolaanroep,
`search_results` of URL's van bronverwijzingen. Als Kimi rechtstreeks antwoordt zonder
onderbouwing (bijvoorbeeld "Ik kan niet op internet zoeken"), retourneert OpenClaw een
`kimi_web_search_ungrounded`-fout in plaats van die tekst als zoekresultaat te behandelen.
Probeer de zoekopdracht opnieuw, schakel over naar een gestructureerde provider zoals Brave, of gebruik
`web_fetch` / de browsertool wanneer u al een doel-URL hebt.

## Toolparameters

| Parameter                                                       | Ondersteund                                                                                                                       |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `query`                                                         | Ja                                                                                                                                |
| `count`                                                         | Geaccepteerd voor compatibiliteit tussen providers, maar genegeerd: Kimi retourneert altijd één samengesteld antwoord, geen lijst met N resultaten |
| `country`, `language`, `freshness`, `date_after`, `date_before` | Nee                                                                                                                               |

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) - alle providers en automatische detectie
- [Moonshot AI](/nl/providers/moonshot) - documentatie voor het Moonshot-model en de Kimi Coding-provider
- [Gemini Search](/nl/tools/gemini-search) - door AI samengestelde antwoorden via onderbouwing van Google
- [Grok Search](/nl/tools/grok-search) - door AI samengestelde antwoorden via onderbouwing van xAI
