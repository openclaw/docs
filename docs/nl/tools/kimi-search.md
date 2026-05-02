---
read_when:
    - Je wilt Kimi gebruiken voor web_search
    - Je hebt een KIMI_API_KEY of MOONSHOT_API_KEY nodig
summary: Kimi-webzoekfunctie via Moonshot-webzoekfunctie
title: Kimi-zoekfunctie
x-i18n:
    generated_at: "2026-05-02T11:29:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: e00dd963257cd40235ebf8375ddbc1ba0344b9b3a82886fbf0fcf975390c27f2
    source_path: tools/kimi-search.md
    workflow: 16
---

OpenClaw ondersteunt Kimi als `web_search`-provider, waarbij Moonshot-webzoekopdrachten worden gebruikt
om door AI samengestelde antwoorden met citaties te produceren.

## Een API-sleutel verkrijgen

<Steps>
  <Step title="Create a key">
    Verkrijg een API-sleutel van [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Store the key">
    Stel `KIMI_API_KEY` of `MOONSHOT_API_KEY` in de Gateway-omgeving in, of
    configureer via:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Wanneer je **Kimi** kiest tijdens `openclaw onboard` of
`openclaw configure --section web`, kan OpenClaw ook vragen om:

- de Moonshot API-regio:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- het standaard Kimi-webzoekmodel (standaard `kimi-k2.6`)

## Configuratie

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
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

Als je de China API-host voor chat gebruikt (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), hergebruikt OpenClaw diezelfde host voor Kimi
`web_search` wanneer `tools.web.search.kimi.baseUrl` is weggelaten, zodat sleutels van
[platform.moonshot.cn](https://platform.moonshot.cn/) niet per ongeluk het
internationale endpoint raken (dat vaak HTTP 401 retourneert). Overschrijf dit
met `tools.web.search.kimi.baseUrl` wanneer je een andere zoekbasis-URL nodig hebt.

**Alternatief via omgeving:** stel `KIMI_API_KEY` of `MOONSHOT_API_KEY` in de
Gateway-omgeving in. Voor een Gateway-installatie plaats je dit in `~/.openclaw/.env`.

Als je `baseUrl` weglaat, gebruikt OpenClaw standaard `https://api.moonshot.ai/v1`.
Als je `model` weglaat, gebruikt OpenClaw standaard `kimi-k2.6`.

## Hoe het werkt

Kimi gebruikt Moonshot-webzoekopdrachten om antwoorden met inline citaties samen te stellen,
vergelijkbaar met de aanpak van Gemini en Grok voor grounded antwoorden.

OpenClaw behandelt Kimi `web_search` alleen als geslaagd nadat Moonshot
native grounding-bewijs voor webzoekopdrachten retourneert, zoals een opnieuw afspeelbare `$web_search`-toolpayload,
`search_results` of citatie-URL's. Als Kimi onmiddellijk stopt met een
gewoon chatantwoord zoals "I cannot browse the internet" en zonder grounding-bewijs,
retourneert OpenClaw in plaats daarvan een gestructureerde `kimi_web_search_ungrounded`-fout in plaats van
die tekst als zoekresultaat te verpakken. Probeer de query opnieuw, schakel over naar een gestructureerde
provider zoals Brave, of gebruik `web_fetch` / de browsertool wanneer je al
een doel-URL hebt.

## Ondersteunde parameters

Kimi-zoekopdrachten ondersteunen `query`.

`count` wordt geaccepteerd voor gedeelde `web_search`-compatibiliteit, maar Kimi retourneert nog steeds
één samengesteld antwoord met citaties in plaats van een lijst met N resultaten.

Providerspecifieke filters worden momenteel niet ondersteund.

## Gerelateerd

- [Overzicht van Web Search](/nl/tools/web) -- alle providers en automatische detectie
- [Moonshot AI](/nl/providers/moonshot) -- documentatie voor Moonshot-model + Kimi Coding-provider
- [Gemini Search](/nl/tools/gemini-search) -- door AI samengestelde antwoorden via Google-grounding
- [Grok Search](/nl/tools/grok-search) -- door AI samengestelde antwoorden via xAI-grounding
