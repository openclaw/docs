---
read_when:
    - Je wilt MiniMax gebruiken voor web_search
    - Je hebt een MiniMax Token Plan-sleutel of OAuth-token nodig
    - Je wilt richtlijnen voor de MiniMax CN/global-zoekhost
summary: MiniMax Search via de zoek-API van Token Plan
title: MiniMax zoeken
x-i18n:
    generated_at: "2026-05-02T11:30:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bb84f38c1407c203b76eea2d7a3ab5fefbdab0844dc20899742581945d7d77e
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw ondersteunt MiniMax als `web_search`-provider via de MiniMax
Token Plan-zoek-API. Deze retourneert gestructureerde zoekresultaten met titels, URL's,
fragmenten en gerelateerde zoekopdrachten.

## Een Token Plan-referentie ophalen

<Steps>
  <Step title="Een sleutel maken">
    Maak of kopieer een MiniMax Token Plan-sleutel vanuit
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
    OAuth-configuraties kunnen in plaats daarvan `MINIMAX_OAUTH_TOKEN` hergebruiken.
  </Step>
  <Step title="De sleutel opslaan">
    Stel `MINIMAX_CODE_PLAN_KEY` in de Gateway-omgeving in, of configureer via:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw accepteert ook `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` en
`MINIMAX_API_KEY` als env-aliassen. `MINIMAX_API_KEY` moet verwijzen naar een
Token Plan-referentie met zoekondersteuning; gewone MiniMax model-API-sleutels worden mogelijk niet
geaccepteerd door het Token Plan-zoekeindpunt.

## Configuratie

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if a MiniMax Token Plan env var is set
            region: "global", // or "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**Omgevingsalternatief:** stel `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` of `MINIMAX_API_KEY` in de Gateway-omgeving in.
Plaats dit voor een gateway-installatie in `~/.openclaw/.env`.

## Regioselectie

MiniMax Search gebruikt deze eindpunten:

- Globaal: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Als `plugins.entries.minimax.config.webSearch.region` niet is ingesteld, bepaalt OpenClaw
de regio in deze volgorde:

1. `tools.web.search.minimax.region` / plugin-eigen `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Dat betekent dat CN-onboarding of `MINIMAX_API_HOST=https://api.minimaxi.com/...`
MiniMax Search automatisch ook op de CN-host houdt.

Zelfs wanneer je MiniMax hebt geauthenticeerd via het OAuth-pad `minimax-portal`,
wordt webzoeken nog steeds geregistreerd met provider-id `minimax`; de basis-URL van de OAuth-provider
wordt gebruikt als regiohint voor CN/globale hostselectie, en `MINIMAX_OAUTH_TOKEN`
kan voldoen als bearer-referentie voor MiniMax Search.

## Ondersteunde parameters

MiniMax Search ondersteunt:

- `query`
- `count` (OpenClaw kort de geretourneerde resultatenlijst in tot het aangevraagde aantal)

Providerspecifieke filters worden momenteel niet ondersteund.

## Gerelateerd

- [Overzicht van webzoeken](/nl/tools/web) -- alle providers en automatische detectie
- [MiniMax](/nl/providers/minimax) -- configuratie van model, afbeelding, spraak en authenticatie
