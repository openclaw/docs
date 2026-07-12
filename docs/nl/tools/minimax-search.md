---
read_when:
    - Je wilt MiniMax gebruiken voor web_search
    - Je hebt een MiniMax Token Plan-sleutel of OAuth-token nodig
    - Je wilt richtlijnen voor de MiniMax-zoekhost voor China/wereldwijd
summary: MiniMax Search via de zoek-API van het Token Plan
title: MiniMax-zoekfunctie
x-i18n:
    generated_at: "2026-07-12T09:29:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e96d1a5fe20847c5fd4476fa6aab8366910b81833c1e42e125d231c4ab003e15
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw ondersteunt MiniMax als `web_search`-provider via de zoek-API van het MiniMax
Token Plan. Deze retourneert gestructureerde zoekresultaten met titels, URL's,
fragmenten en gerelateerde zoekopdrachten.

## Een Token Plan-referentie verkrijgen

<Steps>
  <Step title="Een sleutel aanmaken">
    Maak een MiniMax Token Plan-sleutel aan of kopieer deze vanuit
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
    OAuth-configuraties kunnen in plaats daarvan `MINIMAX_OAUTH_TOKEN` hergebruiken.
  </Step>
  <Step title="De sleutel opslaan">
    Stel `MINIMAX_CODE_PLAN_KEY` in de Gateway-omgeving in of configureer deze via:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw accepteert ook `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN` en
`MINIMAX_API_KEY` als omgevingsvariabele-aliassen, die na
`MINIMAX_CODE_PLAN_KEY` in die volgorde worden gecontroleerd. `MINIMAX_API_KEY` moet verwijzen naar een
Token Plan-referentie waarvoor zoeken is ingeschakeld; gewone API-sleutels voor MiniMax-modellen worden mogelijk niet geaccepteerd door
het Token Plan-zoekendpoint.

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

**Alternatief via de omgeving:** stel `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`,
`MINIMAX_OAUTH_TOKEN` of `MINIMAX_API_KEY` in de Gateway-omgeving in.
Plaats deze bij een Gateway-installatie in `~/.openclaw/.env`.

## Regioselectie

MiniMax Search gebruikt de volgende endpoints:

- Wereldwijd: `https://api.minimax.io/v1/coding_plan/search`
- China: `https://api.minimaxi.com/v1/coding_plan/search`

Als `plugins.entries.minimax.config.webSearch.region` niet is ingesteld, bepaalt OpenClaw
de regio in deze volgorde:

1. `tools.web.search.minimax.region` / Plugin-eigen `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

Dit betekent dat onboarding voor China of `MINIMAX_API_HOST=https://api.minimaxi.com/...`
MiniMax Search automatisch ook op de Chinese host houdt.

Zelfs wanneer u zich bij MiniMax hebt geauthenticeerd via het OAuth-pad `minimax-portal`,
wordt zoeken op het web nog steeds geregistreerd met provider-id `minimax`; de basis-URL van de OAuth-provider
wordt gebruikt als regiohint voor de selectie van de Chinese of wereldwijde host, en `MINIMAX_OAUTH_TOKEN`
kan dienen als bearer-referentie voor MiniMax Search.

## Ondersteunde parameters

| Parameter | Type        | Beperkingen      | Beschrijving                                                                    |
| --------- | ----------- | ---------------- | ------------------------------------------------------------------------------- |
| `query`   | tekenreeks  | verplicht        | Tekenreeks voor de zoekopdracht.                                                |
| `count`   | geheel getal | 1-10, standaard 5 | Aantal te retourneren resultaten. OpenClaw verkort de geretourneerde lijst tot deze grootte. |

Providerspecifieke filters worden momenteel niet ondersteund.

## Gerelateerd

- [Overzicht van zoeken op het web](/nl/tools/web) -- alle providers en automatische detectie
- [MiniMax](/nl/providers/minimax) -- configuratie van modellen, afbeeldingen, spraak en authenticatie
