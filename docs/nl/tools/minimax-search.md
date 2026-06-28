---
read_when:
    - Je wilt MiniMax gebruiken voor web_search
    - Je hebt een MiniMax Token Plan-sleutel of OAuth-token nodig
    - Je wilt richtlijnen voor de CN-/wereldwijde zoekhost van MiniMax
summary: MiniMax Search via de Token Plan-zoek-API
title: MiniMax zoeken
x-i18n:
    generated_at: "2026-05-11T20:53:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0a2dfe4261ab4bc5d234cedf9dff41fbbfbbad8914c6c9c43bc76e8694d99d4
    source_path: tools/minimax-search.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw ondersteunt MiniMax als `web_search`-provider via de MiniMax
Token Plan-zoek-API. Deze geeft gestructureerde zoekresultaten terug met titels, URL's,
fragmenten en gerelateerde query's.

## Een Token Plan-referentie verkrijgen

<Steps>
  <Step title="Create a key">
    Maak of kopieer een MiniMax Token Plan-sleutel vanuit
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
    OAuth-configuraties kunnen in plaats daarvan `MINIMAX_OAUTH_TOKEN` hergebruiken.
  </Step>
  <Step title="Store the key">
    Stel `MINIMAX_CODE_PLAN_KEY` in de Gateway-omgeving in, of configureer via:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw accepteert ook `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` en
`MINIMAX_API_KEY` als env-aliassen. `MINIMAX_API_KEY` moet verwijzen naar een
Token Plan-referentie waarvoor zoeken is ingeschakeld; gewone MiniMax-model-API-sleutels worden mogelijk niet
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
Voor een Gateway-installatie plaats je dit in `~/.openclaw/.env`.

## Regioselectie

MiniMax Search gebruikt deze eindpunten:

- Globaal: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Als `plugins.entries.minimax.config.webSearch.region` niet is ingesteld, bepaalt OpenClaw
de regio in deze volgorde:

1. `tools.web.search.minimax.region` / Plugin-eigen `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Dat betekent dat CN-onboarding of `MINIMAX_API_HOST=https://api.minimaxi.com/...`
MiniMax Search automatisch ook op de CN-host houdt.

Zelfs wanneer je MiniMax hebt geauthenticeerd via het OAuth-pad `minimax-portal`,
wordt webzoekopdracht nog steeds geregistreerd als provider-id `minimax`; de basis-URL van de OAuth-provider
wordt gebruikt als regiohint voor CN/globale hostselectie, en `MINIMAX_OAUTH_TOKEN`
kan voldoen als bearer-referentie voor MiniMax Search.

## Ondersteunde parameters

| Parameter | Type    | Beperkingen | Beschrijving                                                                 |
| --------- | ------- | ----------- | --------------------------------------------------------------------------- |
| `query`   | string  | vereist     | Zoekquerytekenreeks.                                                        |
| `count`   | integer | 1-10        | Aantal resultaten om terug te geven. OpenClaw kort de teruggegeven lijst in tot deze grootte. |

Providerspecifieke filters worden momenteel niet ondersteund.

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [MiniMax](/nl/providers/minimax) -- configuratie voor model, image, speech en auth
