---
read_when:
    - Je wilt MiniMax gebruiken voor web_search
    - Je hebt een MiniMax Coding Plan-sleutel nodig
    - U wilt richtlijnen voor de MiniMax CN/global-zoekhost
summary: MiniMax Search via de Coding Plan-zoek-API
title: MiniMax zoeken
x-i18n:
    generated_at: "2026-04-29T23:25:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20a91bfae72661efd5e0bc3b6247ab05c3487db40ecd9cd5a874858bf3c69df3
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw ondersteunt MiniMax als `web_search`-provider via de MiniMax
Coding Plan-zoek-API. Deze retourneert gestructureerde zoekresultaten met titels, URL's,
fragmenten en gerelateerde zoekopdrachten.

## Een Coding Plan-sleutel verkrijgen

<Steps>
  <Step title="Maak een sleutel">
    Maak of kopieer een MiniMax Coding Plan-sleutel via
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
  </Step>
  <Step title="Sla de sleutel op">
    Stel `MINIMAX_CODE_PLAN_KEY` in de Gateway-omgeving in, of configureer via:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw accepteert ook `MINIMAX_CODING_API_KEY` als env-alias. `MINIMAX_API_KEY`
wordt nog steeds gelezen als compatibiliteitsfallback wanneer deze al naar een coding-plan-token verwijst.

## Configuratie

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if MINIMAX_CODE_PLAN_KEY is set
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

**Omgevingsalternatief:** stel `MINIMAX_CODE_PLAN_KEY` in de Gateway-omgeving in.
Plaats dit voor een gateway-installatie in `~/.openclaw/.env`.

## Regioselectie

MiniMax Search gebruikt deze endpoints:

- Wereldwijd: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

Als `plugins.entries.minimax.config.webSearch.region` niet is ingesteld, bepaalt OpenClaw
de regio in deze volgorde:

1. `tools.web.search.minimax.region` / plugin-beheerde `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Dat betekent dat CN-onboarding of `MINIMAX_API_HOST=https://api.minimaxi.com/...`
MiniMax Search automatisch ook op de CN-host houdt.

Zelfs wanneer je MiniMax hebt geauthenticeerd via het OAuth-pad `minimax-portal`,
wordt web search nog steeds geregistreerd met provider-id `minimax`; de basis-URL
van de OAuth-provider wordt alleen gebruikt als regiohint voor CN/wereldwijde hostselectie.

## Ondersteunde parameters

MiniMax Search ondersteunt:

- `query`
- `count` (OpenClaw kort de geretourneerde resultatenlijst in tot het aangevraagde aantal)

Providerspecifieke filters worden momenteel niet ondersteund.

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [MiniMax](/nl/providers/minimax) -- model-, image-, speech- en auth-configuratie
